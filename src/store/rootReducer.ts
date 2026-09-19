import { combineReducers } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';

/**
 * เพิ่ม slice ใหม่: import reducer แล้วใส่ใน combineReducers
 * ถ้าอยากให้จำค่าหลังปิดแอป ให้เพิ่มชื่อ key ใน PERSIST_WHITELIST ที่ store/persistence.ts
 */
export const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
