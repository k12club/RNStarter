import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../rootReducer';

/**
 * 'unknown'   = กำลังเปิดแอป ยังอ่าน token จาก Keychain ไม่เสร็จ (แสดง splash)
 * 'signedIn'  = มี token
 * 'signedOut' = ไม่มี token / ออกจากระบบ / session หมดอายุ
 */
export type AuthStatus = 'unknown' | 'signedIn' | 'signedOut';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image?: string;
};

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  /** true เมื่อถูกบังคับออกเพราะ session หมดอายุ (ใช้แสดงข้อความในหน้า login) */
  sessionExpired: boolean;
};

const initialState: AuthState = {
  status: 'unknown',
  user: null,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<{ user?: AuthUser | null }>) {
      state.status = 'signedIn';
      state.sessionExpired = false;
      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }
    },
    userUpdated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
    signedOut(state, action: PayloadAction<{ expired?: boolean } | undefined>) {
      state.status = 'signedOut';
      state.user = null;
      state.sessionExpired = action.payload?.expired ?? false;
    },
  },
});

export const { signedIn, userUpdated, signedOut } = authSlice.actions;

export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsSignedIn = (state: RootState) =>
  state.auth.status === 'signedIn';
export const selectSessionExpired = (state: RootState) =>
  state.auth.sessionExpired;

export default authSlice.reducer;
