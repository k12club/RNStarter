import {
  act,
  fireEvent,
  screen,
  userEvent,
} from '@testing-library/react-native';

import { env } from '@/config/env';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { i18n } from '@/i18n';
import { queryClient } from '@/services/query/queryClient';
import * as storeModule from '@/store';
import { renderScreen } from '@/test-utils/renderScreen';

const realCreateStore = storeModule.createStore;
let store: storeModule.AppStore;

beforeEach(() => {
  // เก็บ store ที่ renderWithProviders สร้าง เพื่อตรวจค่าใน Redux หลังผู้ใช้เปลี่ยนการตั้งค่า
  jest.spyOn(storeModule, 'createStore').mockImplementation(() => {
    store = realCreateStore();
    return store;
  });
});

afterEach(async () => {
  jest.restoreAllMocks();
  // i18n เป็นตัวเดียวทั้งไฟล์ test: คืนเป็นภาษาไทยไม่ให้ test ถัดไปได้ภาษาอังกฤษ
  if (i18n.language !== 'th') {
    await act(() => i18n.changeLanguage('th'));
  }
});

function renderSettings() {
  return renderScreen(SettingsScreen, { routeName: 'Settings' });
}

describe('SettingsScreen', () => {
  test('เปลี่ยนธีมแล้วค่าใน store และตัวเลือกที่เลือกเปลี่ยนตาม', async () => {
    const user = userEvent.setup();
    await renderSettings();

    expect(screen.getByTestId('settings-theme')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'ตามเครื่อง' })).toBeSelected();

    await user.press(screen.getByText('มืด'));

    expect(store.getState().settings.themePreference).toBe('dark');
    expect(screen.getByRole('tab', { name: 'มืด' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'ตามเครื่อง' })).not.toBeSelected();

    await user.press(screen.getByText('สว่าง'));
    expect(store.getState().settings.themePreference).toBe('light');
  });

  test('เลือกภาษาอังกฤษแล้วข้อความบนหน้าเปลี่ยนเป็นภาษาอังกฤษ', async () => {
    const user = userEvent.setup();
    await renderSettings();

    expect(screen.getByTestId('settings-language')).toBeOnTheScreen();
    // ยังไม่เคยเลือก: แสดงภาษาที่ใช้อยู่ (ไทย)
    expect(screen.getByRole('radio', { name: 'ไทย' })).toBeChecked();
    expect(screen.getByText('รูปแบบการแสดงผล')).toBeOnTheScreen();

    await user.press(screen.getByRole('radio', { name: 'English' }));

    expect(await screen.findByText('Appearance')).toBeOnTheScreen();
    expect(screen.getByText('Clear cache')).toBeOnTheScreen();
    expect(screen.queryByText('รูปแบบการแสดงผล')).not.toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(store.getState().settings.language).toBe('en');
    expect(i18n.language).toBe('en');
  });

  test('ล้างแคชแล้วเรียก queryClient.clear และแสดง toast', async () => {
    const user = userEvent.setup();
    const clear = jest.spyOn(queryClient, 'clear');
    await renderSettings();

    expect(clear).not.toHaveBeenCalled();
    await user.press(screen.getByTestId('settings-clear-cache'));

    expect(clear).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('ล้างแคชเรียบร้อยแล้ว')).toBeOnTheScreen();
  });

  test('switch การแจ้งเตือน (ตัวอย่าง) เปิดปิดได้ และมีคำอธิบายว่าเป็นตัวอย่าง', async () => {
    await renderSettings();

    expect(screen.getByText(/เป็นตัวอย่างการใช้ Switch/)).toBeOnTheScreen();

    const email = screen.getByRole('switch', { name: 'อีเมลสรุปรายสัปดาห์' });
    expect(email).not.toBeChecked();
    await fireEvent(email, 'valueChange', true);
    expect(email).toBeChecked();
  });

  test('แสดงข้อมูลเกี่ยวกับแอป', async () => {
    await renderSettings();

    expect(screen.getByTestId('settings-about-version')).toBeOnTheScreen();
    expect(screen.getByTestId('settings-about-bundle-id')).toBeOnTheScreen();
    expect(screen.getByText(env.appEnv)).toBeOnTheScreen();
    expect(screen.getByText(env.apiUrl)).toBeOnTheScreen();
    // jest preset ของ RN จำลอง reactNativeVersion เป็น 1000.0.0
    expect(screen.getByText('1000.0.0')).toBeOnTheScreen();
  });
});
