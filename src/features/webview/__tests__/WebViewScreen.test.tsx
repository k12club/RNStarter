import {
  act,
  fireEvent,
  screen,
  userEvent,
} from '@testing-library/react-native';
import type React from 'react';
import {
  BackHandler,
  Linking,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { WebViewScreen } from '@/features/webview/screens/WebViewScreen';
import {
  getNavigationDecision,
  isHttpsUrl,
  toWebViewError,
} from '@/features/webview/utils';
import { renderScreen } from '@/test-utils/renderScreen';
import { lightColors } from '@/theme/colors';

const URL = 'https://reactnative.dev/help';

const mockReload = jest.fn();
const mockGoBack = jest.fn();

// mock กลางใน jest/setup.js เป็น View เฉย ๆ (ref ไม่มี reload / goBack)
// ไฟล์นี้ต้องตรวจว่ากดลองอีกครั้งแล้วเรียก reload จึงเพิ่ม method ผ่าน ref
// ตั้งชื่อตัวแปรเป็น reactModule (ไม่ใช่ React / react): babel ของ NativeWind จะไม่แปลง
// reactModule.createElement เป็นตัวแปรนอก factory ที่ jest.mock ไม่อนุญาต
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  const reactModule = require('react');
  const MockWebView = reactModule.forwardRef((props: object, ref: unknown) => {
    reactModule.useImperativeHandle(ref, () => ({
      reload: mockReload,
      goBack: mockGoBack,
    }));
    return reactModule.createElement(View, props);
  });
  return { __esModule: true, default: MockWebView, WebView: MockWebView };
});

function renderWebView(params: { url: string; title?: string }) {
  return renderScreen(WebViewScreen, { routeName: 'WebView', params });
}

afterEach(() => {
  jest.restoreAllMocks();
  mockReload.mockClear();
  mockGoBack.mockClear();
});

describe('WebViewScreen', () => {
  test('โหลด url แบบ https ใน WebView', async () => {
    await renderWebView({ url: URL, title: 'ช่วยเหลือ' });

    const webView = screen.getByTestId('webview');
    expect(webView).toHaveProp('source', { uri: URL });
    expect(webView).toHaveProp('originWhitelist', ['*']);
    expect(screen.queryByTestId('webview-insecure')).not.toBeOnTheScreen();
  });

  test('ลิงก์ในหน้าเว็บ: https โหลดในแอป, ลิงก์อื่นใน frame หลักส่งให้ระบบ, iframe ไม่ส่งให้ระบบ', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderWebView({ url: URL });
    const shouldStart = screen.getByTestId('webview').props
      .onShouldStartLoadWithRequest as (request: {
      url: string;
      isTopFrame?: boolean;
    }) => boolean;

    expect(
      shouldStart({ url: 'https://reactnative.dev/docs', isTopFrame: true }),
    ).toBe(true);
    expect(openURL).not.toHaveBeenCalled();

    // iframe (iOS) สั่งเปิดแอปอื่น / http: ไม่โหลดและไม่เปิด Safari / แอปอื่นเอง
    expect(shouldStart({ url: 'itms-apps://app/1', isTopFrame: false })).toBe(
      false,
    );
    expect(
      shouldStart({ url: 'http://ads.example.com', isTopFrame: false }),
    ).toBe(false);
    expect(openURL).not.toHaveBeenCalled();

    // ผู้ใช้กดลิงก์ tel: ใน frame หลัก (Android ไม่ส่ง isTopFrame)
    expect(shouldStart({ url: 'tel:021234567' })).toBe(false);
    expect(openURL).toHaveBeenCalledWith('tel:021234567');
  });

  test('url ที่ไม่ใช่ https ไม่ถูกโหลด และแสดงข้อความแจ้ง', async () => {
    await renderWebView({ url: 'http://example.com' });

    expect(screen.queryByTestId('webview')).not.toBeOnTheScreen();
    expect(screen.getByText('เปิดลิงก์นี้ไม่ได้')).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'เปิดในเบราว์เซอร์' }),
    ).not.toBeOnTheScreen();
  });

  test('ปุ่ม external-link บน header เปิดหน้าปัจจุบันในเบราว์เซอร์', async () => {
    const user = userEvent.setup();
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await renderWebView({ url: URL });

    await user.press(
      await screen.findByRole('button', { name: 'เปิดในเบราว์เซอร์' }),
    );
    expect(openURL).toHaveBeenCalledWith(URL);

    // ผู้ใช้กดลิงก์ไปหน้าอื่นในเว็บ: ปุ่มเปิดหน้าที่กำลังดูอยู่
    const next = 'https://reactnative.dev/docs/getting-started';
    await fireEvent(screen.getByTestId('webview'), 'navigationStateChange', {
      url: next,
      canGoBack: true,
    });
    await user.press(
      await screen.findByRole('button', { name: 'เปิดในเบราว์เซอร์' }),
    );
    expect(openURL).toHaveBeenLastCalledWith(next);
  });

  test('Android: ปุ่ม back ย้อนประวัติของหน้าเว็บก่อน ย้อนจนสุดแล้วถอด listener', async () => {
    const addListener = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation(() => ({ remove: jest.fn() }));
    await renderWebView({ url: URL });
    // listener ก่อนหน้านี้เป็นของ NavigationContainer ไม่ใช่ของหน้านี้
    const before = addListener.mock.calls.length;

    await fireEvent(screen.getByTestId('webview'), 'navigationStateChange', {
      url: 'https://reactnative.dev/docs/getting-started',
      canGoBack: true,
    });
    expect(addListener.mock.calls).toHaveLength(before + 1);
    const [eventName, handler] = addListener.mock.calls[before];
    expect(eventName).toBe('hardwareBackPress');
    // handler ของหน้านี้ไม่ใช้ event จึงส่ง object ว่างได้
    expect(handler({} as Parameters<typeof handler>[0])).toBe(true);
    expect(mockGoBack).toHaveBeenCalledTimes(1);

    const { remove } = addListener.mock.results[before].value;
    expect(remove).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('webview'), 'navigationStateChange', {
      url: URL,
      canGoBack: false,
    });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(addListener.mock.calls).toHaveLength(before + 1);
  });

  test('Android: หน้าที่เปิดต่อโหลดไม่สำเร็จ กด back แล้ว error หายพร้อมย้อนหน้าเว็บ', async () => {
    const addListener = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation(() => ({ remove: jest.fn() }));
    await renderWebView({ url: URL });
    const before = addListener.mock.calls.length;

    await fireEvent(screen.getByTestId('webview'), 'navigationStateChange', {
      url: 'https://reactnative.dev/missing',
      canGoBack: true,
    });
    await fireEvent(screen.getByTestId('webview'), 'httpError', {
      nativeEvent: { statusCode: 404, description: 'Not Found' },
    });
    expect(screen.getByTestId('webview-error')).toBeOnTheScreen();

    const [, handler] = addListener.mock.calls[before];
    await act(() => {
      handler({} as Parameters<typeof handler>[0]);
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('webview-error')).not.toBeOnTheScreen();
  });

  test('ระหว่าง reload ใช้ชั้นสีพื้นหลังของ theme แทน loading พื้นขาวของ WebView', async () => {
    await renderWebView({ url: URL });

    const { renderLoading } = screen.getByTestId('webview').props as {
      renderLoading: () => React.ReactElement<{ style: StyleProp<ViewStyle> }>;
    };
    expect(StyleSheet.flatten(renderLoading().props.style)).toMatchObject({
      position: 'absolute',
      backgroundColor: lightColors.background,
    });
  });

  test('แถบความคืบหน้าหายเมื่อโหลดเสร็จ', async () => {
    await renderWebView({ url: URL });

    expect(screen.getByTestId('webview-progress')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('webview'), 'loadProgress', {
      nativeEvent: { progress: 0.5 },
    });
    expect(screen.getByTestId('webview-progress')).toBeOnTheScreen();

    await fireEvent(screen.getByTestId('webview'), 'loadProgress', {
      nativeEvent: { progress: 1 },
    });
    expect(screen.queryByTestId('webview-progress')).not.toBeOnTheScreen();
  });

  test('โหลดไม่สำเร็จแสดง ErrorState และกดลองอีกครั้งแล้วกลับไปที่หน้าเว็บ', async () => {
    const user = userEvent.setup();
    await renderWebView({ url: URL });

    await fireEvent(screen.getByTestId('webview'), 'httpError', {
      nativeEvent: { statusCode: 503, description: 'Service Unavailable' },
    });
    expect(screen.getByText('โหลดหน้าเว็บไม่สำเร็จ')).toBeOnTheScreen();
    expect(
      screen.getByText('ระบบขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง'),
    ).toBeOnTheScreen();
    // WebView ยังอยู่ใต้หน้า error (ไม่ unmount) เพื่อให้ reload ได้
    expect(screen.getByTestId('webview')).toBeOnTheScreen();

    expect(mockReload).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));
    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('webview-error')).not.toBeOnTheScreen();
  });
});

describe('webview utils', () => {
  test.each([
    ['https://reactnative.dev/help', true],
    ['HTTPS://reactnative.dev', true],
    ['http://reactnative.dev', false],
    // กรณีนี้มีไว้ตรวจว่า scheme javascript: ถูกปฏิเสธ (ไม่ได้รันสคริปต์)
    // eslint-disable-next-line no-script-url
    ['javascript:alert(1)', false],
    ['https://', false],
    // ต้องตรวจ string ตัวเดียวกับที่ส่งให้ WebView (ไม่ trim ก่อนตรวจ)
    [' https://reactnative.dev', false],
    ['', false],
    [undefined, false],
  ])('isHttpsUrl(%p) = %p', (url, expected) => {
    expect(isHttpsUrl(url)).toBe(expected);
  });

  test.each([
    ['https://reactnative.dev/docs', true, 'load'],
    ['https://www.youtube.com/embed/x', false, 'load'],
    ['about:blank', true, 'load'],
    ['about:srcdoc', false, 'load'],
    ['http://example.com', true, 'external'],
    ['mailto:help@example.com', undefined, 'external'],
    ['http://ads.example.com', false, 'block'],
    ['itms-apps://app/1', false, 'block'],
    ['about:blankx', false, 'block'],
  ] as const)(
    'getNavigationDecision(%p, isTopFrame=%p) = %p',
    (url, isTopFrame, expected) => {
      expect(getNavigationDecision(url, isTopFrame)).toBe(expected);
    },
  );

  test('toWebViewError แปลง error ของหน้าเว็บเป็นชนิดที่แสดงข้อความได้ถูก', () => {
    expect(toWebViewError({ description: 'offline' }).kind).toBe('network');
    expect(toWebViewError({ statusCode: 404 }).kind).toBe('not_found');
    expect(toWebViewError({ statusCode: 502 }).kind).toBe('server');
    // เว็บภายนอกตอบ 401 ไม่ได้แปลว่า session ของแอปหมดอายุ
    expect(toWebViewError({ statusCode: 401 }).kind).toBe('unknown');
  });
});
