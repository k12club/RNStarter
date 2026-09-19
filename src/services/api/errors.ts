import axios from 'axios';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'cancelled'
  | 'unknown';

/**
 * error รูปแบบเดียวที่ทุกชั้นบนของแอปต้องรับมือ
 * (หน้าจอ / React Query / RTK) ไม่ต้องรู้จัก AxiosError
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly data?: unknown;

  constructor(params: {
    kind: ApiErrorKind;
    message: string;
    status?: number;
    data?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status;
    this.data = params.data;
  }

  /** error ที่ลองใหม่แล้วอาจสำเร็จ (ใช้ตัดสินใจ retry ใน React Query) */
  get isRetryable() {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'server'
    );
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) {
    return 'unauthorized';
  }
  if (status === 403) {
    return 'forbidden';
  }
  if (status === 404) {
    return 'not_found';
  }
  if (status === 400 || status === 409 || status === 422) {
    return 'validation';
  }
  if (status >= 500) {
    return 'server';
  }
  return 'unknown';
}

/** ดึงข้อความ error จาก body ของ response (รองรับรูปแบบที่พบบ่อย) */
function messageFromData(data: unknown): string | undefined {
  if (typeof data === 'string' && data.length > 0 && data.length < 300) {
    return data;
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['message', 'error', 'detail', 'title']) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }
  return undefined;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiError({ kind: 'cancelled', message: 'Request cancelled' });
  }

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ kind: 'timeout', message: 'Request timed out' });
    }
    if (!error.response) {
      return new ApiError({
        kind: 'network',
        message: error.message || 'Network error',
      });
    }
    const { status, data } = error.response;
    return new ApiError({
      kind: kindFromStatus(status),
      status,
      data,
      message: messageFromData(data) ?? `Request failed with status ${status}`,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ kind: 'unknown', message: error.message });
  }

  return new ApiError({ kind: 'unknown', message: 'Unknown error' });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
