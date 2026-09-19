import {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  ApiError,
  type ApiErrorKind,
  isApiError,
  toApiError,
} from '@/services/api/errors';

const config: InternalAxiosRequestConfig = {
  headers: new AxiosHeaders(),
  url: '/products',
  method: 'get',
};

function httpError(status: number, data: unknown): AxiosError {
  const response: AxiosResponse = {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  };
  return new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    {},
    response,
  );
}

describe('toApiError: axios', () => {
  it('ไม่มี response = network', () => {
    const error = toApiError(
      new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {}),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('network');
    expect(error.message).toBe('Network Error');
    expect(error.status).toBeUndefined();
  });

  it('ไม่มี response และไม่มีข้อความ ใช้ข้อความ default', () => {
    const error = toApiError(new AxiosError('', undefined, config, {}));
    expect(error.kind).toBe('network');
    expect(error.message).toBe('Network error');
  });

  it.each(['ECONNABORTED', 'ETIMEDOUT'])('code %s = timeout', code => {
    const error = toApiError(
      new AxiosError('timeout of 15000ms exceeded', code, config, {}),
    );
    expect(error.kind).toBe('timeout');
    expect(error.message).toBe('Request timed out');
  });

  it.each<[number, ApiErrorKind]>([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'validation'],
    [422, 'validation'],
    [500, 'server'],
    [503, 'server'],
    [418, 'unknown'],
  ])(
    'status %i = %s และเก็บ status / data / message จาก body',
    (status, kind) => {
      const body = { message: `server says ${status}` };
      const error = toApiError(httpError(status, body));
      expect(error.kind).toBe(kind);
      expect(error.status).toBe(status);
      expect(error.data).toEqual(body);
      expect(error.message).toBe(`server says ${status}`);
    },
  );

  it.each([
    ['error', { error: 'Invalid credentials' }, 'Invalid credentials'],
    ['detail', { detail: 'Not allowed' }, 'Not allowed'],
    ['title', { title: 'Bad things' }, 'Bad things'],
    ['string body', 'Plain text error', 'Plain text error'],
  ])('ดึงข้อความจาก %s', (_label, data, expected) => {
    expect(toApiError(httpError(400, data)).message).toBe(expected);
  });

  it('body ไม่มีข้อความที่ใช้ได้ ใช้ข้อความตาม status', () => {
    expect(toApiError(httpError(500, {})).message).toBe(
      'Request failed with status 500',
    );
    expect(toApiError(httpError(500, { message: '' })).message).toBe(
      'Request failed with status 500',
    );
    expect(toApiError(httpError(502, 'x'.repeat(300))).message).toBe(
      'Request failed with status 502',
    );
    expect(toApiError(httpError(500, null)).message).toBe(
      'Request failed with status 500',
    );
  });
});

describe('toApiError: อื่น ๆ', () => {
  it('ยกเลิก request = cancelled (แม้ CanceledError จะเป็น AxiosError)', () => {
    const error = toApiError(new CanceledError(undefined, undefined, config));
    expect(error.kind).toBe('cancelled');
    expect(error.message).toBe('Request cancelled');
  });

  it('ApiError เดิมคืน instance เดิม', () => {
    const original = new ApiError({ kind: 'forbidden', message: 'no' });
    expect(toApiError(original)).toBe(original);
  });

  it('Error ธรรมดา = unknown พร้อมข้อความเดิม', () => {
    const error = toApiError(new TypeError('boom'));
    expect(error.kind).toBe('unknown');
    expect(error.message).toBe('boom');
  });

  it.each([
    ['string', 'oops'],
    ['undefined', undefined],
    ['object', { a: 1 }],
  ])('ค่าที่ไม่ใช่ Error (%s) = unknown', (_label, value) => {
    const error = toApiError(value);
    expect(error.kind).toBe('unknown');
    expect(error.message).toBe('Unknown error');
  });
});

describe('ApiError', () => {
  it('เป็น Error ที่มีชื่อ ApiError', () => {
    const error = new ApiError({
      kind: 'server',
      message: 'down',
      status: 500,
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error('x'))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });

  it.each<[ApiErrorKind, boolean]>([
    ['network', true],
    ['timeout', true],
    ['server', true],
    ['unauthorized', false],
    ['forbidden', false],
    ['not_found', false],
    ['validation', false],
    ['cancelled', false],
    ['unknown', false],
  ])('%s isRetryable = %s', (kind, expected) => {
    expect(new ApiError({ kind, message: kind }).isRetryable).toBe(expected);
  });
});
