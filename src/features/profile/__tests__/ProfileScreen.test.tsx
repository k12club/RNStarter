import { QueryClient } from '@tanstack/react-query';
import { act, screen, userEvent, waitFor } from '@testing-library/react-native';
import DeviceInfo from 'react-native-device-info';

import * as dialogModule from '@/components/ui/DialogProvider';
import { authApi } from '@/features/auth/api/authApi';
import * as session from '@/features/auth/session';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { ApiError } from '@/services/api/errors';
import * as storeModule from '@/store';
import { type AuthUser, signedIn } from '@/store/slices/authSlice';
import { renderScreen } from '@/test-utils/renderScreen';

const USER: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: 'https://dummyjson.com/icon/emilys/128',
};

const realCreateStore = storeModule.createStore;
const realDefaultQueryOptions = QueryClient.prototype.defaultQueryOptions;
const realDefaultMutationOptions = QueryClient.prototype.defaultMutationOptions;

beforeEach(() => {
  // QueryClient ของ renderWithProviders ใช้ gcTime 5 นาที: หลัง unmount จะเหลือ timer ค้าง
  // ทำให้ Jest ไม่ยอมจบ (ค้าง ~5 นาที) gcTime = Infinity คือไม่ตั้ง timer เลย
  jest
    .spyOn(QueryClient.prototype, 'defaultQueryOptions')
    .mockImplementation(function (this: QueryClient, options) {
      return {
        ...realDefaultQueryOptions.call(this, options),
        gcTime: Infinity,
      };
    });
  jest
    .spyOn(QueryClient.prototype, 'defaultMutationOptions')
    .mockImplementation(function (this: QueryClient, options) {
      return {
        ...realDefaultMutationOptions.call(this, options),
        gcTime: Infinity,
      };
    });

  // store ที่ renderWithProviders สร้างยังไม่ได้เข้าสู่ระบบ (useCurrentUser จะไม่เรียก /auth/me)
  // จึงให้ createStore คืน store ที่เข้าสู่ระบบแล้วแต่ยังไม่มีข้อมูลผู้ใช้ (เหมือนเปิดแอปครั้งถัดไป)
  jest.spyOn(storeModule, 'createStore').mockImplementation(() => {
    const store = realCreateStore();
    store.dispatch(signedIn({}));
    return store;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function renderProfile() {
  return renderScreen(ProfileScreen, { routeName: 'Profile' });
}

/** render แล้วรอให้ /auth/me ตอบกลับก่อน (ให้การอัปเดต state ของ query อยู่ใน act) */
async function renderProfileLoaded() {
  await renderProfile();
  expect(await screen.findByText('Emily Johnson')).toBeOnTheScreen();
}

/** promise ที่ resolve เองได้ ใช้ค้างสถานะ loading / pending ไว้ตรวจ */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('ProfileScreen', () => {
  test('แสดงชื่อ อีเมล และชื่อผู้ใช้จาก /auth/me', async () => {
    const me = jest.spyOn(authApi, 'me').mockResolvedValue(USER);

    await renderProfile();

    expect(await screen.findByText('Emily Johnson')).toBeOnTheScreen();
    expect(screen.getByText('emily.johnson@x.dummyjson.com')).toBeOnTheScreen();
    expect(screen.getByText('@emilys')).toBeOnTheScreen();
    expect(screen.queryByTestId('profile-skeleton')).not.toBeOnTheScreen();
    expect(me).toHaveBeenCalledTimes(1);
  });

  test('ระหว่างโหลดข้อมูลผู้ใช้แสดง skeleton', async () => {
    const pending = deferred<AuthUser>();
    jest.spyOn(authApi, 'me').mockReturnValue(pending.promise);

    await renderProfile();

    expect(
      screen.getByRole('progressbar', { name: 'กำลังโหลดข้อมูลโปรไฟล์' }),
    ).toBeOnTheScreen();

    pending.resolve(USER);
    expect(await screen.findByText('Emily Johnson')).toBeOnTheScreen();
    expect(screen.queryByTestId('profile-skeleton')).not.toBeOnTheScreen();
  });

  test('โหลดข้อมูลผู้ใช้ไม่สำเร็จ: กดลองอีกครั้งแล้วแสดง skeleton จนได้ข้อมูล', async () => {
    const user = userEvent.setup();
    const retry = deferred<AuthUser>();
    jest
      .spyOn(authApi, 'me')
      .mockRejectedValueOnce(
        new ApiError({ kind: 'server', status: 503, message: 'down' }),
      )
      .mockReturnValueOnce(retry.promise);

    await renderProfile();

    const retryButton = await screen.findByRole('button', {
      name: 'ลองอีกครั้ง',
    });
    await user.press(retryButton);
    expect(await screen.findByTestId('profile-skeleton')).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'ลองอีกครั้ง' }),
    ).not.toBeOnTheScreen();

    retry.resolve(USER);
    expect(await screen.findByText('Emily Johnson')).toBeOnTheScreen();
  });

  test('แสดงเวอร์ชันแอปและหมายเลขบิลด์ในแถวเกี่ยวกับแอป', async () => {
    jest.spyOn(authApi, 'me').mockResolvedValue(USER);
    jest.spyOn(DeviceInfo, 'getVersion').mockReturnValue('1.4.0');
    jest.spyOn(DeviceInfo, 'getBuildNumber').mockReturnValue('27');

    await renderProfileLoaded();

    expect(screen.getByText('เกี่ยวกับแอป')).toBeOnTheScreen();
    expect(screen.getByText('1.4.0 (27)')).toBeOnTheScreen();
  });

  test.each([
    ['profile-settings', 'route:Settings'],
    ['profile-gallery', 'route:ComponentGallery'],
  ])('กด %s แล้วไปหน้า %s', async (testID, expected) => {
    const user = userEvent.setup();
    jest.spyOn(authApi, 'me').mockResolvedValue(USER);

    await renderProfileLoaded();
    await user.press(screen.getByTestId(testID));

    expect(await screen.findByText(expected)).toBeOnTheScreen();
  });

  test.each([
    [
      'profile-privacy',
      {
        url: 'https://reactnative.dev/docs/security',
        title: 'นโยบายความเป็นส่วนตัว',
      },
    ],
    [
      'profile-help',
      { url: 'https://reactnative.dev/help', title: 'ช่วยเหลือและติดต่อเรา' },
    ],
  ])('กด %s แล้วเปิด WebView พร้อม url และชื่อหน้า', async (testID, params) => {
    const user = userEvent.setup();
    jest.spyOn(authApi, 'me').mockResolvedValue(USER);

    await renderProfileLoaded();
    await user.press(screen.getByTestId(testID));

    expect(await screen.findByText('route:WebView')).toBeOnTheScreen();
    expect(
      screen.getByText(`params:${JSON.stringify(params)}`),
    ).toBeOnTheScreen();
  });

  describe('ออกจากระบบ', () => {
    test('ถามยืนยันก่อน และเรียก endSession หลังกดยืนยันเท่านั้น', async () => {
      const user = userEvent.setup();
      jest.spyOn(authApi, 'me').mockResolvedValue(USER);
      const logout = deferred<void>();
      const endSession = jest
        .spyOn(session, 'endSession')
        .mockReturnValue(logout.promise);

      await renderProfileLoaded();
      await user.press(screen.getByTestId('profile-logout'));

      expect(
        await screen.findByRole('header', { name: 'ต้องการออกจากระบบใช่ไหม' }),
      ).toBeOnTheScreen();
      expect(endSession).not.toHaveBeenCalled();

      await user.press(
        screen.getByRole('button', { name: 'ยืนยันออกจากระบบ' }),
      );

      await waitFor(() => expect(endSession).toHaveBeenCalledTimes(1));
      // ระหว่างรอออกจากระบบ มี overlay กันการกดซ้ำ
      expect(
        await screen.findByTestId('profile-logout-overlay'),
      ).toBeOnTheScreen();

      logout.resolve();
      await waitFor(() =>
        expect(
          screen.queryByTestId('profile-logout-overlay'),
        ).not.toBeOnTheScreen(),
      );
    });

    test('กดซ้ำระหว่างที่ dialog ยังเปิดอยู่ ไม่เปิด dialog ยืนยันซ้อน', async () => {
      const user = userEvent.setup();
      jest.spyOn(authApi, 'me').mockResolvedValue(USER);
      const answer = deferred<boolean>();
      const confirm = jest.fn(() => answer.promise);
      jest
        .spyOn(dialogModule, 'useDialog')
        .mockReturnValue({ confirm, alert: jest.fn() });
      const endSession = jest
        .spyOn(session, 'endSession')
        .mockResolvedValue(undefined);

      await renderProfileLoaded();
      await user.press(screen.getByTestId('profile-logout'));
      await user.press(screen.getByTestId('profile-logout'));
      expect(confirm).toHaveBeenCalledTimes(1);

      // ปิด dialog แล้วกดใหม่ได้ตามปกติ
      await act(async () => answer.resolve(false));
      await user.press(screen.getByTestId('profile-logout'));
      expect(confirm).toHaveBeenCalledTimes(2);
      expect(endSession).not.toHaveBeenCalled();
    });

    test('กดยกเลิกแล้วไม่ออกจากระบบ', async () => {
      const user = userEvent.setup();
      jest.spyOn(authApi, 'me').mockResolvedValue(USER);
      const endSession = jest
        .spyOn(session, 'endSession')
        .mockResolvedValue(undefined);

      await renderProfileLoaded();
      await user.press(screen.getByTestId('profile-logout'));
      await user.press(await screen.findByRole('button', { name: 'ยกเลิก' }));

      await waitFor(() =>
        expect(
          screen.queryByRole('header', { name: 'ต้องการออกจากระบบใช่ไหม' }),
        ).not.toBeOnTheScreen(),
      );
      expect(endSession).not.toHaveBeenCalled();
    });
  });
});
