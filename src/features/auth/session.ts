import { type AuthTokens, tokenStorage } from '@/services/auth/tokenStorage';
import { queryClient } from '@/services/query/queryClient';
import { store } from '@/store';
import { type AuthUser, signedIn, signedOut } from '@/store/slices/authSlice';

/**
 * จัดการ session ที่เดียว (ทั้งจาก hook, interceptor และ bootstrap)
 * ลำดับสำคัญ: เขียน token ให้เสร็จก่อน แล้วค่อยเปลี่ยน state ให้ navigator สลับหน้า
 */

/** อ่าน token จาก Keychain ตอนเปิดแอป แล้วตั้งสถานะ auth */
export async function restoreSession(): Promise<void> {
  const tokens = await tokenStorage.load();
  if (tokens) {
    store.dispatch(signedIn({}));
  } else {
    store.dispatch(signedOut());
  }
}

export async function startSession(user: AuthUser, tokens: AuthTokens) {
  await tokenStorage.save(tokens);
  store.dispatch(signedIn({ user }));
}

/**
 * ออกจากระบบ: ลบ token + ล้าง cache ของ React Query (ข้อมูลของ user เดิมต้องไม่ค้าง)
 * expired = true เมื่อถูกบังคับออกเพราะ refresh token ไม่ผ่าน
 */
export async function endSession(options: { expired?: boolean } = {}) {
  await tokenStorage.clear();
  queryClient.clear();
  store.dispatch(signedOut({ expired: options.expired }));
}
