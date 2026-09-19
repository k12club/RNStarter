import { timeoutManager } from '@tanstack/react-query';
import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import React, { useEffect } from 'react';

import { authApi } from '@/features/auth/api/authApi';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { i18n } from '@/i18n';
import { ApiError } from '@/services/api/errors';
import { tokenStorage } from '@/services/auth/tokenStorage';
import { store } from '@/store';
import { useAppDispatch } from '@/store/hooks';
import { signedOut, type AuthUser } from '@/store/slices/authSlice';
import { renderScreen } from '@/test-utils/renderScreen';

/**
 * workaround: QueryClient ใน renderWithProviders ใช้ gcTime ค่าเริ่มต้น (5 นาที)
 * timer เก็บขยะของ mutation ค้างหลัง test จบ ทำให้ Jest ไม่ exit ("did not exit one second after ...")
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
const TOKENS = { accessToken: 'access-token', refreshToken: 'refresh-token' };

const TEXT = {
  title: 'เข้าสู่ระบบ',
  usernameRequired: 'กรุณากรอกชื่อผู้ใช้',
  passwordRequired: 'กรุณากรอกรหัสผ่าน',
  usernameMin: 'ต้องมีอย่างน้อย 3 ตัวอักษร',
  invalidCredentials:
    'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองอีกครั้ง',
  network: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง',
  sessionExpired: 'เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้งเพื่อใช้งานต่อ',
};

function renderLogin(component: React.ComponentType<any> = LoginScreen) {
  return renderScreen(component, { routeName: 'Login' });
}

/** เปิดหน้า login หลังถูกบังคับออกเพราะ session หมดอายุ (store ของ test สร้างใหม่ทุกครั้ง) */
function ExpiredLoginScreen(props: React.ComponentProps<typeof LoginScreen>) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(signedOut({ expired: true }));
  }, [dispatch]);
  return <LoginScreen {...props} />;
}

afterEach(async () => {
  jest.restoreAllMocks();
  // startSession เขียนลง store ตัวจริงของแอป (singleton) ต้องคืนค่าทุก test
  store.dispatch(signedOut());
  await tokenStorage.clear();
  // i18n เป็น singleton: test เปลี่ยนภาษาแล้วต้องคืนเป็นไทย
  if (i18n.language !== 'th') {
    await act(async () => {
      await i18n.changeLanguage('th');
    });
  }
});

describe('LoginScreen', () => {
  test('แสดงหัวข้อเข้าสู่ระบบเพียงจุดเดียว และไม่มีแถบ session หมดอายุ', async () => {
    await renderLogin();

    expect(screen.getByText(TEXT.title)).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: TEXT.title })).toBeOnTheScreen();
    expect(screen.queryByText(TEXT.sessionExpired)).not.toBeOnTheScreen();
    expect(screen.queryByTestId('login-error')).not.toBeOnTheScreen();
  });

  test('กดส่งโดยไม่กรอก แสดง error ภาษาไทยพร้อมชื่อช่อง และจำนวนตัวอักษรขั้นต่ำ', async () => {
    const user = userEvent.setup();
    const login = jest.spyOn(authApi, 'login');
    await renderLogin();

    await user.press(screen.getByTestId('login-submit'));

    expect(await screen.findByText(TEXT.usernameRequired)).toBeOnTheScreen();
    expect(screen.getByText(TEXT.passwordRequired)).toBeOnTheScreen();

    // หลังส่งครั้งแรก react-hook-form ตรวจใหม่ทุกครั้งที่พิมพ์
    await user.type(screen.getByTestId('login-username'), 'ab');
    expect(await screen.findByText(TEXT.usernameMin)).toBeOnTheScreen();
    expect(screen.queryByText(TEXT.usernameRequired)).not.toBeOnTheScreen();

    expect(login).not.toHaveBeenCalled();
  });

  test('กดกรอกบัญชีทดลอง แล้วช่องชื่อผู้ใช้และรหัสผ่านมีค่า', async () => {
    const user = userEvent.setup();
    await renderLogin();

    await user.press(screen.getByTestId('login-fill-demo'));

    expect(screen.getByTestId('login-username')).toHaveDisplayValue('emilys');
    expect(screen.getByTestId('login-password')).toHaveDisplayValue(
      'emilyspass',
    );
  });

  test('เข้าสู่ระบบสำเร็จ เรียก API ด้วยค่าที่ตัดช่องว่างแล้ว บันทึก token และสถานะเป็น signedIn', async () => {
    const user = userEvent.setup();
    const login = jest
      .spyOn(authApi, 'login')
      .mockResolvedValue({ user: USER, tokens: TOKENS });
    await renderLogin();

    await user.type(screen.getByTestId('login-username'), '  emilys ');
    await user.type(screen.getByTestId('login-password'), 'emilyspass');
    await user.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(store.getState().auth.status).toBe('signedIn'));
    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith({
      username: 'emilys',
      password: 'emilyspass',
    });
    expect(store.getState().auth.user).toEqual(USER);
    expect(tokenStorage.get()).toEqual(TOKENS);
    expect(screen.queryByTestId('login-error')).not.toBeOnTheScreen();
  });

  test('รหัสผิด (API ตอบ validation) แสดงข้อความชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', async () => {
    const user = userEvent.setup();
    jest.spyOn(authApi, 'login').mockRejectedValue(
      new ApiError({
        kind: 'validation',
        status: 400,
        message: 'Invalid credentials',
      }),
    );
    await renderLogin();

    await user.press(screen.getByTestId('login-fill-demo'));
    await user.press(screen.getByTestId('login-submit'));

    const banner = await screen.findByTestId('login-error');
    expect(banner).toHaveTextContent(TEXT.invalidCredentials);
    expect(
      screen.getByRole('alert', { name: TEXT.invalidCredentials }),
    ).toBeOnTheScreen();
    expect(store.getState().auth.status).not.toBe('signedIn');
    expect(tokenStorage.get()).toBeNull();
  });

  test('เชื่อมต่อไม่ได้ แสดงข้อความ error ตามชนิด (errors:network)', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(authApi, 'login')
      .mockRejectedValue(
        new ApiError({ kind: 'network', message: 'Network Error' }),
      );
    await renderLogin();

    await user.press(screen.getByTestId('login-fill-demo'));
    await user.press(screen.getByTestId('login-submit'));

    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      TEXT.network,
    );
  });

  test('เปลี่ยนภาษาเป็นอังกฤษ ข้อความบนหน้าเปลี่ยนตาม', async () => {
    const user = userEvent.setup();
    await renderLogin();

    expect(screen.getByTestId('login-lang-th')).toBeSelected();

    await user.press(screen.getByTestId('login-lang-en'));

    expect(
      await screen.findByRole('header', { name: 'Sign in' }),
    ).toBeOnTheScreen();
    expect(screen.queryByText(TEXT.title)).not.toBeOnTheScreen();
    expect(screen.getByTestId('login-lang-en')).toBeSelected();
    expect(screen.getByTestId('login-lang-th')).not.toBeSelected();
  });

  test('ถูกบังคับออกเพราะ session หมดอายุ แสดงแถบแจ้งเตือน', async () => {
    await renderLogin(ExpiredLoginScreen);

    expect(
      await screen.findByTestId('login-session-expired'),
    ).toHaveTextContent(TEXT.sessionExpired);
  });

  test('กดดูชุดคอมโพเนนต์ ไปหน้า ComponentGallery ได้โดยไม่ต้องเข้าสู่ระบบ', async () => {
    const user = userEvent.setup();
    await renderLogin();

    await user.press(screen.getByTestId('login-open-gallery'));

    expect(await screen.findByText('route:ComponentGallery')).toBeOnTheScreen();
  });
});
