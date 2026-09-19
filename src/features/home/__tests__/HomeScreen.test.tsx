import { timeoutManager } from '@tanstack/react-query';
import { act, screen, userEvent } from '@testing-library/react-native';
import React, { useEffect } from 'react';

import { authApi } from '@/features/auth/api/authApi';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { useAppDispatch } from '@/store/hooks';
import { type AuthUser, signedIn } from '@/store/slices/authSlice';
import { renderScreen } from '@/test-utils/renderScreen';

/**
 * workaround: QueryClient ใน renderWithProviders ใช้ gcTime ค่าเริ่มต้น (5 นาที)
 * timer เก็บขยะของ query ค้างหลัง test จบ ทำให้ Jest ไม่ exit ("did not exit one second after ...")
 * แก้จริงคือใส่ gcTime: Infinity ใน renderWithProviders ระหว่างนี้ unref timer ไม่ให้ค้าง process
 */
timeoutManager.setTimeoutProvider({
  setTimeout: (callback: () => void, delay: number) => {
    const id = setTimeout(callback, delay);
    (id as unknown as { unref?: () => void }).unref?.();
    return id;
  },
  clearTimeout: id => clearTimeout(id),
  setInterval: (callback: () => void, delay: number) =>
    setInterval(callback, delay),
  clearInterval: id => clearInterval(id),
});

const USER: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
};

/**
 * store ของ test เริ่มที่ status 'unknown' ทำให้ useCurrentUser ไม่ยิง /auth/me
 * ตัวห่อนี้ตั้งสถานะเป็น signedIn (มี token แต่ยังไม่มี user เหมือนเปิดแอปครั้งถัดไป)
 */
function SignedInHomeScreen(props: React.ComponentProps<typeof HomeScreen>) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(signedIn({}));
  }, [dispatch]);
  return <HomeScreen {...props} />;
}

function renderHome() {
  return renderScreen(SignedInHomeScreen, { routeName: 'Home' });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('HomeScreen', () => {
  test('แสดง skeleton ระหว่างโหลดผู้ใช้ แล้วทักทายด้วยชื่อจริง', async () => {
    let resolveMe: (user: AuthUser) => void = () => {};
    const me = jest.spyOn(authApi, 'me').mockImplementation(
      () =>
        new Promise<AuthUser>(resolve => {
          resolveMe = resolve;
        }),
    );
    await renderHome();

    expect(
      await screen.findByTestId('home-greeting-skeleton'),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('home-greeting')).not.toBeOnTheScreen();

    await act(async () => {
      resolveMe(USER);
    });

    expect(await screen.findByTestId('home-greeting')).toHaveTextContent(
      'สวัสดี Emily',
    );
    expect(
      screen.queryByTestId('home-greeting-skeleton'),
    ).not.toBeOnTheScreen();
    expect(me).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['home-action-products', 'route:MainTabs', 'params:{"screen":"Products"}'],
    ['home-action-gallery', 'route:ComponentGallery', 'params:{}'],
    ['home-action-settings', 'route:Settings', 'params:{}'],
    [
      'home-action-docs',
      'route:WebView',
      'params:{"url":"https://reactnative.dev/docs/getting-started","title":"เอกสาร React Native"}',
    ],
  ])('กด %s แล้วไปหน้า %s', async (testID, route, params) => {
    const user = userEvent.setup();
    jest.spyOn(authApi, 'me').mockResolvedValue(USER);
    await renderHome();
    await screen.findByText('สวัสดี Emily');

    await user.press(screen.getByTestId(testID));

    expect(await screen.findByText(route)).toBeOnTheScreen();
    expect(screen.getByText(params)).toBeOnTheScreen();
  });

  test('การ์ดตัวอย่างแสดงเงินบาท ตัวเลข และวันที่ปี พ.ศ.', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue(USER);
    await renderHome();
    await screen.findByText('สวัสดี Emily');

    expect(screen.getByTestId('home-stat-currency')).toHaveTextContent(
      /฿123,456\.78/,
    );
    expect(screen.getByTestId('home-stat-number')).toHaveTextContent(
      /9,876,543/,
    );
    const buddhistYear = String(new Date().getFullYear() + 543);
    expect(screen.getByTestId('home-stat-date')).toHaveTextContent(
      new RegExp(buddhistYear),
    );
    expect(screen.getByText('React Native 0.87')).toBeOnTheScreen();
  });

  test('ดึงลงเพื่อรีเฟรช โหลดข้อมูลผู้ใช้ใหม่', async () => {
    const me = jest.spyOn(authApi, 'me').mockResolvedValue(USER);
    await renderHome();
    await screen.findByText('สวัสดี Emily');
    expect(me).toHaveBeenCalledTimes(1);

    // mock ของ ScrollView ส่ง props ต่อให้ host element: เรียก onRefresh ของ RefreshControl ตรง ๆ
    const scroll = screen.getByTestId('home-scroll');
    await act(async () => {
      await scroll.props.refreshControl.props.onRefresh();
    });

    expect(me).toHaveBeenCalledTimes(2);
  });
});
