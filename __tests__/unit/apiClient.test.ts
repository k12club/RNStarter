import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  apiClient,
  configureApiAuth,
  setApiLanguage,
} from '@/services/api/client';
import { ApiError } from '@/services/api/errors';
import { type AuthTokens, tokenStorage } from '@/services/auth/tokenStorage';

/**
 * ทดสอบ interceptor ของ apiClient ด้วย adapter ปลอม (ไม่ออก network จริง)
 * adapter ต้องโยน AxiosError เองเมื่อ status >= 400: axios ไม่เรียก validateStatus ให้ adapter ที่เขียนเอง
 */

type Reply = { status: number; data?: unknown };
type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

type Call = {
  url?: string;
  authorization: unknown;
  language: unknown;
};

const OLD: AuthTokens = {
  accessToken: 'old-access',
  refreshToken: 'old-refresh',
};
const NEW: AuthTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
};

let calls: Call[] = [];
let handler: Handler = () => ({ status: 200 });

const fakeAdapter: AxiosAdapter = async config => {
  calls.push({
    url: config.url,
    authorization: config.headers.get('Authorization'),
    language: config.headers.get('Accept-Language'),
  });
  const { status, data = { url: config.url } } = await handler(config);
  const response: AxiosResponse = {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  };
  if (status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      {},
      response,
    );
  }
  return response;
};

/** server ปลอม: รับเฉพาะ access token ที่กำหนด นอกนั้นตอบ 401 */
function acceptOnly(accessToken: string): Handler {
  return config =>
    config.headers.get('Authorization') === `Bearer ${accessToken}`
      ? { status: 200 }
      : { status: 401, data: { message: 'Token Expired!' } };
}

/** ปล่อยให้ microtask ทั้งหมด (interceptor ของ axios) ทำงานจนหมดก่อน */
function flush() {
  return new Promise<void>(resolve => setTimeout(() => resolve(), 0));
}

const refresh = jest.fn<Promise<AuthTokens>, [string]>();
const onSessionExpired = jest.fn();
const originalAdapter = apiClient.defaults.adapter;

beforeAll(() => {
  apiClient.defaults.adapter = fakeAdapter;
});

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter;
});

beforeEach(async () => {
  calls = [];
  handler = () => ({ status: 200 });
  refresh.mockReset();
  onSessionExpired.mockReset();
  configureApiAuth({ refresh, onSessionExpired });
  await tokenStorage.clear();
  // .env เปิด ENABLE_API_LOG และ refresh ล้มเหลวจะ log warn: ปิดเสียงไว้
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  setApiLanguage('th');
  jest.restoreAllMocks();
});

describe('request interceptor', () => {
  it('แนบ Bearer token จาก tokenStorage', async () => {
    await tokenStorage.save(OLD);
    await apiClient.get('/auth/me');
    expect(calls).toHaveLength(1);
    expect(calls[0].authorization).toBe('Bearer old-access');
  });

  it('ยังไม่ login ไม่แนบ Authorization', async () => {
    await apiClient.get('/products');
    expect(calls[0].authorization).toBeUndefined();
  });

  it('skipAuth ไม่แนบ Authorization แม้มี token', async () => {
    await tokenStorage.save(OLD);
    await apiClient.post(
      '/auth/login',
      { username: 'emilys' },
      { skipAuth: true },
    );
    expect(calls[0].authorization).toBeUndefined();
  });

  it('Accept-Language ตาม setApiLanguage', async () => {
    await apiClient.get('/a');
    setApiLanguage('en');
    await apiClient.get('/b');
    setApiLanguage('th');
    await apiClient.get('/c');
    expect(calls.map(c => c.language)).toEqual(['th', 'en', 'th']);
  });
});

describe('refresh token เมื่อได้ 401', () => {
  it('refresh ครั้งเดียวสำหรับ 3 request ที่ได้ 401 พร้อมกัน แล้วส่งซ้ำด้วย token ใหม่', async () => {
    await tokenStorage.save(OLD);
    handler = acceptOnly(NEW.accessToken);

    let resolveRefresh: (tokens: AuthTokens) => void = () => {};
    refresh.mockImplementation(
      () =>
        new Promise<AuthTokens>(resolve => {
          resolveRefresh = resolve;
        }),
    );

    const pending = Promise.all([
      apiClient.get('/a'),
      apiClient.get('/b'),
      apiClient.get('/c'),
    ]);

    // ทั้ง 3 request ได้ 401 และรอ refresh ตัวเดียวกันอยู่
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith(OLD.refreshToken);

    resolveRefresh(NEW);
    const responses = await pending;

    expect(responses.map(r => r.data)).toEqual([
      { url: '/a' },
      { url: '/b' },
      { url: '/c' },
    ]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(6);
    expect(calls.slice(0, 3).map(c => c.authorization)).toEqual([
      'Bearer old-access',
      'Bearer old-access',
      'Bearer old-access',
    ]);
    expect(
      calls
        .slice(3)
        .map(c => [c.url, c.authorization])
        .sort(),
    ).toEqual([
      ['/a', 'Bearer new-access'],
      ['/b', 'Bearer new-access'],
      ['/c', 'Bearer new-access'],
    ]);
    expect(tokenStorage.get()).toEqual(NEW);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('request ที่ได้ 401 หลัง refresh เสร็จไปแล้ว ส่งซ้ำด้วย token ปัจจุบันโดยไม่ refresh อีก', async () => {
    await tokenStorage.save(OLD);
    refresh.mockResolvedValue(NEW);

    // /slow ตอบช้า: ได้ 401 (token เก่า) หลังจาก /fast refresh เสร็จแล้ว
    let releaseSlow: () => void = () => {};
    const slowGate = new Promise<void>(resolve => {
      releaseSlow = resolve;
    });
    const accept = acceptOnly(NEW.accessToken);
    handler = async config => {
      if (config.url === '/slow' && !config._retried) {
        await slowGate;
      }
      return accept(config);
    };

    const slow = apiClient.get('/slow');
    await apiClient.get('/fast');
    expect(refresh).toHaveBeenCalledTimes(1);

    releaseSlow();
    const response = await slow;

    expect(response.data).toEqual({ url: '/slow' });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(
      calls.filter(c => c.url === '/slow').map(c => c.authorization),
    ).toEqual(['Bearer old-access', 'Bearer new-access']);
  });

  it('refresh ไม่สำเร็จ: ล้าง token เรียก onSessionExpired และ reject เป็น ApiError unauthorized', async () => {
    await tokenStorage.save(OLD);
    handler = acceptOnly(NEW.accessToken);
    refresh.mockRejectedValue(new Error('refresh token expired'));

    const error = await apiClient.get('/auth/me').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('unauthorized');
    expect((error as ApiError).status).toBe(401);
    expect((error as ApiError).message).toBe('Token Expired!');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.get()).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it('refresh ไม่สำเร็จกับ 3 request ที่ได้ 401 พร้อมกัน: refresh ครั้งเดียว ทุกตัว reject เป็น unauthorized', async () => {
    await tokenStorage.save(OLD);
    handler = acceptOnly(NEW.accessToken);
    refresh.mockRejectedValue(new Error('refresh token expired'));

    const results = await Promise.allSettled([
      apiClient.get('/a'),
      apiClient.get('/b'),
      apiClient.get('/c'),
    ]);

    expect(
      results.map(r =>
        r.status === 'rejected' && r.reason instanceof ApiError
          ? r.reason.kind
          : r.status,
      ),
    ).toEqual(['unauthorized', 'unauthorized', 'unauthorized']);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalled();
    expect(tokenStorage.get()).toBeNull();
    // ไม่ส่งซ้ำเมื่อไม่มี token ใหม่
    expect(calls).toHaveLength(3);
  });

  // กันถอยหลัง: onSessionExpired ต้องถูกเรียกครั้งเดียวต่อการ refresh ที่ล้มเหลว (เคยได้ครั้งละ request)
  it('refresh ไม่สำเร็จกับ 3 request ที่ได้ 401 พร้อมกัน เรียก onSessionExpired ครั้งเดียว', async () => {
    await tokenStorage.save(OLD);
    handler = acceptOnly(NEW.accessToken);
    refresh.mockRejectedValue(new Error('refresh token expired'));

    await Promise.allSettled([
      apiClient.get('/a'),
      apiClient.get('/b'),
      apiClient.get('/c'),
    ]);

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('request ที่ส่งซ้ำแล้วยังได้ 401 ไม่ refresh วนซ้ำ', async () => {
    await tokenStorage.save(OLD);
    handler = () => ({ status: 401 });
    refresh.mockResolvedValue(NEW);

    const error = await apiClient.get('/admin').catch((e: unknown) => e);

    expect((error as ApiError).kind).toBe('unauthorized');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls.map(c => c.authorization)).toEqual([
      'Bearer old-access',
      'Bearer new-access',
    ]);
  });

  it('skipAuth ได้ 401 ไม่ refresh (เช่น login ผิด)', async () => {
    await tokenStorage.save(OLD);
    handler = () => ({ status: 401, data: { message: 'Invalid credentials' } });

    const error = await apiClient
      .post('/auth/login', {}, { skipAuth: true })
      .catch((e: unknown) => e);

    expect((error as ApiError).kind).toBe('unauthorized');
    expect((error as ApiError).message).toBe('Invalid credentials');
    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toEqual(OLD);
  });

  it('ไม่มี refresh token ไม่ refresh และ reject ทันที', async () => {
    handler = () => ({ status: 401 });

    const error = await apiClient.get('/auth/me').catch((e: unknown) => e);

    expect((error as ApiError).kind).toBe('unauthorized');
    expect(refresh).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it('error อื่นที่ไม่ใช่ 401 แปลงเป็น ApiError โดยไม่ refresh', async () => {
    await tokenStorage.save(OLD);
    handler = () => ({ status: 500, data: { message: 'down' } });

    const error = await apiClient.get('/products').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('server');
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('refresh token: ไม่ออกจากระบบโดยไม่จำเป็น / ไม่ชุบ session ที่ออกไปแล้ว', () => {
  it.each(['network', 'timeout', 'server'] as const)(
    'refresh ล้มเพราะ %s: คง token ไว้ ไม่เรียก onSessionExpired และ reject ด้วย error ของ refresh',
    async kind => {
      await tokenStorage.save(OLD);
      handler = acceptOnly(NEW.accessToken);
      refresh.mockRejectedValue(new ApiError({ kind, message: kind }));

      const results = await Promise.allSettled([
        apiClient.get('/a'),
        apiClient.get('/b'),
      ]);

      expect(
        results.map(r =>
          r.status === 'rejected' && r.reason instanceof ApiError
            ? r.reason.kind
            : r.status,
        ),
      ).toEqual([kind, kind]);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(onSessionExpired).not.toHaveBeenCalled();
      expect(tokenStorage.get()).toEqual(OLD);
      await expect(tokenStorage.load()).resolves.toEqual(OLD);
    },
  );

  it('server ปฏิเสธ refresh token (401): ล้าง token และเรียก onSessionExpired', async () => {
    await tokenStorage.save(OLD);
    handler = acceptOnly(NEW.accessToken);
    refresh.mockRejectedValue(
      new ApiError({
        kind: 'unauthorized',
        status: 401,
        message: 'Invalid refresh token',
      }),
    );

    const error = await apiClient.get('/a').catch((e: unknown) => e);

    expect((error as ApiError).kind).toBe('unauthorized');
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(tokenStorage.get()).toBeNull();
  });

  it('ออกจากระบบระหว่างรอ refresh: ไม่เขียน token ใหม่กลับลง Keychain', async () => {
    await tokenStorage.save(OLD);
    handler = acceptOnly(NEW.accessToken);
    let resolveRefresh: (tokens: AuthTokens) => void = () => {};
    refresh.mockImplementation(
      () =>
        new Promise<AuthTokens>(resolve => {
          resolveRefresh = resolve;
        }),
    );

    const pending = apiClient.get('/a').catch((e: unknown) => e);
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);

    // ผู้ใช้กดออกจากระบบ (endSession ล้าง token) ก่อน refresh ตอบกลับ
    await tokenStorage.clear();
    resolveRefresh(NEW);
    const error = await pending;

    expect((error as ApiError).kind).toBe('unauthorized');
    expect(tokenStorage.get()).toBeNull();
    await expect(tokenStorage.load()).resolves.toBeNull();
    expect(onSessionExpired).not.toHaveBeenCalled();
    // ไม่ส่ง request ซ้ำด้วย token ของ session ที่ออกไปแล้ว
    expect(calls).toHaveLength(1);
  });

  it('login ใหม่ระหว่างรอ refresh ที่ล้มเหลว: ไม่ล้าง session ใหม่', async () => {
    const FRESH: AuthTokens = {
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
    };
    await tokenStorage.save(OLD);
    handler = acceptOnly(NEW.accessToken);
    let rejectRefresh: (error: unknown) => void = () => {};
    refresh.mockImplementation(
      () =>
        new Promise<AuthTokens>((_resolve, reject) => {
          rejectRefresh = reject;
        }),
    );

    const pending = apiClient.get('/a').catch((e: unknown) => e);
    await flush();

    await tokenStorage.save(FRESH);
    rejectRefresh(
      new ApiError({ kind: 'unauthorized', status: 401, message: 'expired' }),
    );
    await pending;

    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(tokenStorage.get()).toEqual(FRESH);
    await expect(tokenStorage.load()).resolves.toEqual(FRESH);
  });
});
