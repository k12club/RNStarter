import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { env } from '@/config/env';
import { type AuthTokens, tokenStorage } from '@/services/auth/tokenStorage';
import { logger } from '@/utils/logger';

import { toApiError } from './errors';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** ไม่แนบ Authorization header และไม่พยายาม refresh token (เช่น login, refresh) */
    skipAuth?: boolean;
    /** ใช้ภายใน: request นี้ถูกส่งซ้ำหลัง refresh token แล้ว */
    _retried?: boolean;
  }
}

type AuthHandlers = {
  /** เรียก API refresh token แล้วคืน token ชุดใหม่ */
  refresh: (refreshToken: string) => Promise<AuthTokens>;
  /** server ปฏิเสธ refresh token (session หมดอายุ) เช่น dispatch signOut; เน็ตหลุด / timeout / 5xx ไม่เรียก */
  onSessionExpired: () => void;
};

let authHandlers: AuthHandlers | null = null;
let language = 'th';

/** ผูกการ refresh token เข้ากับ client (เรียกครั้งเดียวใน bootstrap) */
export function configureApiAuth(handlers: AuthHandlers) {
  authHandlers = handlers;
}

/** ส่งภาษาปัจจุบันไปกับทุก request ผ่าน Accept-Language */
export function setApiLanguage(lang: string) {
  language = lang;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  config.headers.set('Accept-Language', language);

  if (!config.skipAuth) {
    const tokens = tokenStorage.get();
    if (tokens?.accessToken) {
      config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }
  }

  if (env.enableApiLog) {
    logger.debug(
      `-> ${config.method?.toUpperCase()} ${config.baseURL ?? ''}${
        config.url ?? ''
      }`,
    );
  }
  return config;
});

/**
 * single-flight refresh: ถ้ามีหลาย request ได้ 401 พร้อมกัน ให้ refresh แค่ครั้งเดียว
 * แล้วทุก request รอ promise เดียวกัน
 */
let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const handlers = authHandlers;
  const current = tokenStorage.get();
  if (!handlers || !current?.refreshToken) {
    return null;
  }
  // ระหว่างรอ refresh ผู้ใช้ออกจากระบบ / login ใหม่: ห้ามเขียน token เก่ากลับ และห้ามสั่งออกจากระบบซ้ำ
  const sessionChanged = () =>
    tokenStorage.get()?.refreshToken !== current.refreshToken;

  let next: AuthTokens;
  try {
    next = await handlers.refresh(current.refreshToken);
  } catch (error) {
    const apiError = toApiError(error);
    // เน็ตหลุด / timeout / 5xx ไม่ได้แปลว่า session หมดอายุ: คง token ไว้ ให้ request เดิม fail ด้วย error นี้ (ลองใหม่ได้)
    if (apiError.isRetryable) {
      logger.warn(
        'refresh token failed (retryable)',
        apiError.kind,
        apiError.message,
      );
      throw apiError;
    }
    // ทำใน single flight: ต่อให้มีหลาย request รอ refresh อยู่ ก็แจ้ง session หมดอายุครั้งเดียว
    logger.warn('refresh token failed', apiError.kind, apiError.message);
    if (!sessionChanged()) {
      await tokenStorage.clear();
      handlers.onSessionExpired();
    }
    return null;
  }

  if (sessionChanged()) {
    return null;
  }
  try {
    await tokenStorage.save(next);
    return next;
  } catch (error) {
    logger.warn('refresh token save failed', error);
    await tokenStorage.clear();
    handlers.onSessionExpired();
    return null;
  }
}

apiClient.interceptors.response.use(
  response => {
    if (env.enableApiLog) {
      logger.debug(`<- ${response.status} ${response.config.url ?? ''}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (env.enableApiLog) {
      logger.debug(`<- ${status ?? error.code} ${config?.url ?? ''}`);
    }

    const canRefresh =
      status === 401 &&
      config &&
      !config.skipAuth &&
      !config._retried &&
      !!tokenStorage.get()?.refreshToken;

    if (canRefresh) {
      // request นี้ถูกส่งด้วย token เก่า แต่มีคน refresh ไปแล้ว: ส่งซ้ำด้วย token ปัจจุบันเลย
      const current = tokenStorage.get();
      const sent = config.headers.get('Authorization');
      if (current && sent && sent !== `Bearer ${current.accessToken}`) {
        config._retried = true;
        config.headers.set('Authorization', `Bearer ${current.accessToken}`);
        return apiClient(config);
      }

      refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null;
      });
      const tokens = await refreshPromise;

      if (tokens) {
        config._retried = true;
        config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
        return apiClient(config);
      }
    }

    return Promise.reject(toApiError(error));
  },
);
