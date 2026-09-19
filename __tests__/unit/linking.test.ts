import { getStateFromPath } from '@react-navigation/native';

import { createLinking } from '@/navigation/linking';

/** path -> state ตาม config จริงของแอป (หา route ที่ focus อยู่) */
function focusedRoute(
  path: string,
  initial: 'Login' | 'MainTabs' = 'MainTabs',
) {
  const state = getStateFromPath(path, createLinking(initial).config);
  const route = state?.routes[state.routes.length - 1];
  return { state, route };
}

test('products/:id แปลง id เป็นตัวเลข และมีหน้าก่อนหน้าเป็น MainTabs (มีปุ่มย้อนกลับ)', () => {
  const { state, route } = focusedRoute('products/7');
  expect(state?.routes.map(r => r.name)).toEqual(['MainTabs', 'ProductDetail']);
  expect(route?.params).toEqual({ id: 7 });
});

test('ทิ้ง ?title= จากลิงก์ภายนอก (กันปลอมชื่อ header)', () => {
  const { route } = focusedRoute('products/7?title=บัญชีถูกระงับ');
  expect(route?.name).toBe('ProductDetail');
  expect((route?.params as { title?: string }).title).toBeUndefined();
});
