import { apiClient } from '@/services/api/client';
import type { AuthTokens } from '@/services/auth/tokenStorage';
import type { AuthUser } from '@/store/slices/authSlice';

/**
 * Auth API (ตัวอย่างใช้ DummyJSON: https://dummyjson.com/docs/auth)
 * เปลี่ยนเป็น API จริง: แก้ path / รูปแบบ response ในไฟล์นี้ไฟล์เดียว
 * ส่วนอื่นของแอปใช้แค่ AuthTokens / AuthUser
 */

export type LoginInput = {
  username: string;
  password: string;
};

type LoginResponse = AuthUser & AuthTokens;

const TOKEN_TTL_MINUTES = 30;

function toUser(data: AuthUser): AuthUser {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    image: data.image,
  };
}

export const authApi = {
  async login(
    input: LoginInput,
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const { data } = await apiClient.post<LoginResponse>(
      '/auth/login',
      { ...input, expiresInMins: TOKEN_TTL_MINUTES },
      { skipAuth: true },
    );
    return {
      user: toUser(data),
      tokens: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
    };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await apiClient.post<AuthTokens>(
      '/auth/refresh',
      { refreshToken, expiresInMins: TOKEN_TTL_MINUTES },
      { skipAuth: true },
    );
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<AuthUser>('/auth/me');
    return toUser(data);
  },
};
