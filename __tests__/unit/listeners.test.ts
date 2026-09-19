import { i18n, initI18n } from '@/i18n';
import { createStore } from '@/store';
import { resetSettings, setLanguage } from '@/store/slices/settingsSlice';

/** listener ของ store: ภาษาใน Redux กับภาษาของ i18n ต้องตรงกันเสมอ */

initI18n('th');

/** effect ของ listener เป็น async: รอ microtask ให้ changeLanguage ทำงานเสร็จ */
function flush() {
  return new Promise<void>(resolve => setTimeout(() => resolve(), 0));
}

afterEach(async () => {
  await i18n.changeLanguage('th');
});

test('setLanguage เปลี่ยนภาษาของ i18n', async () => {
  const store = createStore({});
  store.dispatch(setLanguage('en'));
  await flush();
  expect(i18n.language).toBe('en');
});

test('resetSettings กลับไปใช้ภาษาเริ่มต้นทันที (ไม่ค้างภาษาเดิมจนเปิดแอปใหม่)', async () => {
  const store = createStore({});
  store.dispatch(setLanguage('en'));
  await flush();
  expect(i18n.language).toBe('en');

  store.dispatch(resetSettings());
  await flush();

  expect(store.getState().settings.language).toBeNull();
  expect(i18n.language).toBe('th');
});
