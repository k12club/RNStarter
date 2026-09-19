import { render, screen } from '@testing-library/react-native';
import React from 'react';

import App from '@/app/App';

/**
 * Smoke test ทั้งแอป: bootstrap -> อ่าน Keychain (mock ว่าง) -> signedOut -> แสดงหน้า Login
 * ถ้า test นี้พัง แปลว่า mock ของ native module ใน jest/setup.js ไม่ครบ หรือ provider เรียงผิด
 */
test('เปิดแอปครั้งแรกแล้วเห็นหน้าเข้าสู่ระบบ', async () => {
  await render(<App />);
  expect(await screen.findByText('เข้าสู่ระบบ')).toBeOnTheScreen();
});
