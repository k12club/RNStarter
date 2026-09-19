import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  type NetInfoState,
  NetInfoStateType,
  useNetInfo,
} from '@react-native-community/netinfo';
import {
  NavigationContext,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import {
  act,
  fireEvent,
  screen,
  userEvent,
  waitFor,
  within,
} from '@testing-library/react-native';
import React, { createRef, useState } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as ui from '@/components/ui';
import { AppHeader } from '@/components/ui/AppHeader';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { type DialogApi, useDialog } from '@/components/ui/DialogProvider';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { toast } from '@/components/ui/ToastProvider';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { lightColors } from '@/theme';

function ConfirmHarness() {
  const dialog = useDialog();
  const [result, setResult] = useState('ยังไม่ได้เลือก');

  return (
    <View>
      <Button
        title="เปิดยืนยัน"
        onPress={async () => {
          const ok = await dialog.confirm({
            title: 'ลบรายการนี้?',
            message: 'ลบแล้วกู้คืนไม่ได้',
            destructive: true,
          });
          setResult(ok ? 'ผลลัพธ์: ยืนยัน' : 'ผลลัพธ์: ยกเลิก');
        }}
      />
      <Button
        title="เปิดแจ้งเตือน"
        onPress={async () => {
          await dialog.alert({ title: 'บันทึกแล้ว' });
          setResult('ผลลัพธ์: ปิดแจ้งเตือน');
        }}
      />
      <Text>{result}</Text>
    </View>
  );
}

// เก็บ API ของ dialog ไว้เรียกตรง ๆ ใน test (จำลองการเรียกต่อกันหลัง await)
const dialogRef: { current: DialogApi | null } = { current: null };
function DialogCapture() {
  dialogRef.current = useDialog();
  return null;
}

function getDialog(): DialogApi {
  if (!dialogRef.current) {
    throw new Error('DialogCapture ยังไม่ได้ render');
  }
  return dialogRef.current;
}

describe('useDialog', () => {
  test('confirm: กดยืนยันแล้ว resolve เป็น true และ dialog ปิด', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<ConfirmHarness />);

    await user.press(screen.getByRole('button', { name: 'เปิดยืนยัน' }));
    expect(
      await screen.findByRole('header', { name: 'ลบรายการนี้?' }),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'ยืนยัน' }));

    expect(await screen.findByText('ผลลัพธ์: ยืนยัน')).toBeOnTheScreen();
    expect(screen.queryByText('ลบรายการนี้?')).not.toBeOnTheScreen();
  });

  test('confirm: กดยกเลิกแล้ว resolve เป็น false', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<ConfirmHarness />);

    await user.press(screen.getByRole('button', { name: 'เปิดยืนยัน' }));
    await user.press(await screen.findByRole('button', { name: 'ยกเลิก' }));

    expect(await screen.findByText('ผลลัพธ์: ยกเลิก')).toBeOnTheScreen();
  });

  test('confirm: ปุ่ม back ของ Android (onRequestClose) = ยกเลิก', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<ConfirmHarness />);

    await user.press(screen.getByRole('button', { name: 'เปิดยืนยัน' }));
    // event ไล่ขึ้นไปหา onRequestClose ของ Modal
    // RNTL v14 fireEvent คืน Promise แต่ rule ของ eslint-plugin-testing-library ยังถือว่าเป็น sync
    await fireEvent(await screen.findByText('ลบรายการนี้?'), 'requestClose');

    expect(await screen.findByText('ผลลัพธ์: ยกเลิก')).toBeOnTheScreen();
  });

  test('alert: กดตกลงแล้ว resolve', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<ConfirmHarness />);

    await user.press(screen.getByRole('button', { name: 'เปิดแจ้งเตือน' }));
    await user.press(await screen.findByRole('button', { name: 'ตกลง' }));

    expect(await screen.findByText('ผลลัพธ์: ปิดแจ้งเตือน')).toBeOnTheScreen();
  });

  describe('dialog ถัดไปหลังปิดอันเดิม', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    test('iOS: รอ Modal เดิมปิดเสร็จก่อน ไม่สั่งเปิดซ้ำระหว่าง fade-out', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      await renderWithProviders(<DialogCapture />);

      let first: Promise<boolean> | undefined;
      await act(async () => {
        first = getDialog().confirm({ title: 'ลบรายการนี้?' });
      });
      await user.press(screen.getByRole('button', { name: 'ยืนยัน' }));
      await expect(first).resolves.toBe(true);

      // เช่น ลบไม่สำเร็จเพราะ offline แล้วแจ้ง error ทันที
      let second: Promise<void> | undefined;
      await act(async () => {
        second = getDialog().alert({ title: 'ลบไม่สำเร็จ' });
      });
      expect(
        screen.queryByRole('header', { name: 'ลบไม่สำเร็จ' }),
      ).not.toBeOnTheScreen();

      // mock ของ Modal ไม่ยิง onDismiss: timer สำรองต้องปล่อยคิวให้ ไม่ค้าง
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(
        screen.getByRole('header', { name: 'ลบไม่สำเร็จ' }),
      ).toBeOnTheScreen();

      await user.press(screen.getByRole('button', { name: 'ตกลง' }));
      await expect(second).resolves.toBeUndefined();
    });

    test('Android: เปิดอันถัดไปได้ทันที', async () => {
      const os = jest.replaceProperty(Platform, 'OS', 'android');
      try {
        const user = userEvent.setup();
        await renderWithProviders(<DialogCapture />);

        let first: Promise<boolean> | undefined;
        await act(async () => {
          first = getDialog().confirm({ title: 'ลบรายการนี้?' });
        });
        await user.press(screen.getByRole('button', { name: 'ยืนยัน' }));
        await expect(first).resolves.toBe(true);
        await act(async () => {
          getDialog()
            .alert({ title: 'ลบไม่สำเร็จ' })
            .catch(() => {});
        });

        expect(
          screen.getByRole('header', { name: 'ลบไม่สำเร็จ' }),
        ).toBeOnTheScreen();
      } finally {
        os.restore();
      }
    });
  });
});

describe('toast', () => {
  test('toast.show แสดงข้อความแล้วปิดเองเมื่อครบเวลา', async () => {
    await renderWithProviders(<View />);

    await act(async () => {
      toast.show({
        type: 'success',
        title: 'สำเร็จ',
        message: 'บันทึกข้อมูลแล้ว',
        duration: 50,
      });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'สำเร็จบันทึกข้อมูลแล้ว',
    );

    await waitFor(() =>
      expect(screen.queryByText('บันทึกข้อมูลแล้ว')).not.toBeOnTheScreen(),
    );
  });

  test('แสดงพร้อมกันไม่เกิน 3 อัน อันเก่าสุดถูกดันออก', async () => {
    await renderWithProviders(<View />);

    await act(async () => {
      ['หนึ่ง', 'สอง', 'สาม', 'สี่'].forEach(message =>
        toast.info(message, { duration: 0 }),
      );
    });

    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(screen.queryByText('หนึ่ง')).not.toBeOnTheScreen();
    expect(screen.getByText('สี่')).toBeOnTheScreen();
  });

  test('ข้อความซ้ำไม่ซ้อนเป็นหลายอัน', async () => {
    await renderWithProviders(<View />);

    await act(async () => {
      toast.error('เชื่อมต่อไม่ได้', { duration: 0 });
      toast.error('เชื่อมต่อไม่ได้', { duration: 0 });
    });

    expect(screen.getAllByText('เชื่อมต่อไม่ได้')).toHaveLength(1);
  });

  test('เรียกก่อน provider mount แล้วแสดงเมื่อ mount', async () => {
    toast.warning('เรียกก่อน mount', { duration: 0 });

    await renderWithProviders(<View />);

    expect(await screen.findByText('เรียกก่อน mount')).toBeOnTheScreen();
  });

  test('กดปุ่มปิดแล้ว toast หาย', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<View />);

    await act(async () => {
      toast.info('กดปิดได้', { duration: 0 });
    });
    await user.press(screen.getByRole('button', { name: 'ปิด' }));

    await waitFor(() =>
      expect(screen.queryByText('กดปิดได้')).not.toBeOnTheScreen(),
    );
  });
});

describe('Screen', () => {
  test('scroll: render เนื้อหาใน ScrollView พร้อม footer', async () => {
    await renderWithProviders(
      <Screen
        scroll
        padded
        onRefresh={jest.fn()}
        scrollProps={{ testID: 'screen-scroll' }}
        footer={<Button title="บันทึก" />}
      >
        <Text>เนื้อหาหน้าจอ</Text>
      </Screen>,
    );

    expect(
      within(screen.getByTestId('screen-scroll')).getByText('เนื้อหาหน้าจอ'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'บันทึก' })).toBeOnTheScreen();
  });

  test('scroll: pull-to-refresh และ bottomOffset ตามส่วนของ footer ที่อยู่เหนือคีย์บอร์ด', async () => {
    const insetsMock = jest.mocked(useSafeAreaInsets);
    const original = insetsMock.getMockImplementation();
    // iPhone ที่มี home indicator
    insetsMock.mockImplementation(() => ({
      top: 47,
      bottom: 34,
      left: 0,
      right: 0,
    }));

    try {
      const onRefresh = jest.fn();
      const scrollProps = { testID: 'screen-scroll' };
      const view = await renderWithProviders(
        <Screen
          scroll
          onRefresh={onRefresh}
          scrollProps={scrollProps}
          footer={<Button title="บันทึก" />}
        >
          <Text>เนื้อหาหน้าจอ</Text>
        </Screen>,
      );

      const refreshControl =
        screen.getByTestId('screen-scroll').props.refreshControl;
      expect(refreshControl.props).toEqual(
        expect.objectContaining({
          onRefresh,
          refreshing: false,
          tintColor: lightColors.primary,
        }),
      );

      // footer สูง 100 (รวม paddingBottom 34) ตอนคีย์บอร์ดเปิดเลื่อนลงใต้คีย์บอร์ด 34 - 12 = 22
      // RNTL v14 fireEvent คืน Promise แต่ rule ของ eslint-plugin-testing-library ยังถือว่าเป็น sync
      await fireEvent(screen.getByText('บันทึก'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 100 } },
      });
      expect(screen.getByTestId('screen-scroll').props.bottomOffset).toBe(
        16 + 100 - 22,
      );

      // เอา footer ออก: ต้องไม่ใช้ความสูงเก่าค้าง
      await view.rerender(
        <Screen scroll onRefresh={onRefresh} scrollProps={scrollProps}>
          <Text>เนื้อหาหน้าจอ</Text>
        </Screen>,
      );
      expect(screen.getByTestId('screen-scroll').props.bottomOffset).toBe(16);
    } finally {
      insetsMock.mockImplementation(original);
    }
  });

  test('ไม่ scroll: render เนื้อหาตรง ๆ และ header', async () => {
    await renderWithProviders(
      <Screen header={<AppHeader title="หัวข้อหน้า" />}>
        <Text>เนื้อหาธรรมดา</Text>
      </Screen>,
    );

    expect(screen.getByText('เนื้อหาธรรมดา')).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: 'หัวข้อหน้า' }),
    ).toBeOnTheScreen();
  });

  test('overlay: คลุมหน้าและซ่อนเนื้อหาด้านล่างจาก screen reader', async () => {
    await renderWithProviders(
      <Screen
        header={<AppHeader title="หัวข้อหน้า" />}
        overlay={<LoadingOverlay visible message="กำลังโหลดหน้า" />}
      >
        <Text>เนื้อหาธรรมดา</Text>
      </Screen>,
    );

    expect(
      screen.getByRole('progressbar', { name: 'กำลังโหลดหน้า' }),
    ).toBeOnTheScreen();
    // accessibilityViewIsModal ของ overlay ทำให้ sibling ถูกซ่อนจาก screen reader
    expect(screen.queryByText('เนื้อหาธรรมดา')).not.toBeOnTheScreen();
    expect(
      screen.getByText('เนื้อหาธรรมดา', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });
});

describe('AppHeader', () => {
  test('ไม่มี navigator และไม่มี onBackPress: ไม่แสดงปุ่มย้อนกลับ', async () => {
    await renderWithProviders(<AppHeader title="หน้าแรก" />);

    expect(
      screen.queryByRole('button', { name: 'ย้อนกลับ' }),
    ).not.toBeOnTheScreen();
  });

  test('onBackPress: กดปุ่มย้อนกลับแล้วเรียก callback', async () => {
    const user = userEvent.setup();
    const onBackPress = jest.fn();
    await renderWithProviders(
      <AppHeader title="รายละเอียด" onBackPress={onBackPress} />,
    );

    await user.press(screen.getByRole('button', { name: 'ย้อนกลับ' }));

    expect(onBackPress).toHaveBeenCalledTimes(1);
  });

  function fakeNavigation(
    state: { type: string; index: number },
    parent?: NavigationProp<ParamListBase>,
  ) {
    return {
      getState: () => state,
      getParent: () => parent,
      // ทั้ง tab (backBehavior firstRoute) และ stack คืน true เมื่อไม่ได้อยู่หน้าแรก
      canGoBack: () => true,
      goBack: jest.fn(),
    } as unknown as NavigationProp<ParamListBase>;
  }

  test('แท็บที่ไม่ใช่แท็บแรก: ไม่แสดงปุ่มย้อนกลับ แม้ canGoBack() เป็น true', async () => {
    await renderWithProviders(
      <NavigationContext.Provider
        value={fakeNavigation({ type: 'tab', index: 1 })}
      >
        <AppHeader title="สินค้า" />
      </NavigationContext.Provider>,
    );

    expect(
      screen.queryByRole('button', { name: 'ย้อนกลับ' }),
    ).not.toBeOnTheScreen();
  });

  test('stack ที่ซ้อนในแท็บ (หน้าแรกของ stack): ไม่แสดงปุ่มย้อนกลับ', async () => {
    const tab = fakeNavigation({ type: 'tab', index: 1 });
    await renderWithProviders(
      <NavigationContext.Provider
        value={fakeNavigation({ type: 'stack', index: 0 }, tab)}
      >
        <AppHeader title="สินค้า" />
      </NavigationContext.Provider>,
    );

    expect(
      screen.queryByRole('button', { name: 'ย้อนกลับ' }),
    ).not.toBeOnTheScreen();
  });

  test('หน้าที่สองของ stack: แสดงปุ่มย้อนกลับ กดแล้ว goBack', async () => {
    const user = userEvent.setup();
    const navigation = fakeNavigation({ type: 'stack', index: 1 });
    await renderWithProviders(
      <NavigationContext.Provider value={navigation}>
        <AppHeader title="รายละเอียด" />
      </NavigationContext.Provider>,
    );

    await user.press(screen.getByRole('button', { name: 'ย้อนกลับ' }));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  test('ไม่มี title: ไม่ render header ว่างให้ screen reader อ่าน', async () => {
    await renderWithProviders(<AppHeader onBackPress={jest.fn()} />);

    expect(screen.queryByRole('header')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'ย้อนกลับ' })).toBeOnTheScreen();
  });
});

describe('LoadingOverlay', () => {
  test('แสดงเมื่อ visible และหายเมื่อปิด', async () => {
    const view = await renderWithProviders(
      <LoadingOverlay visible={false} message="กำลังบันทึก" />,
    );
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();

    await view.rerender(<LoadingOverlay visible message="กำลังบันทึก" />);
    expect(
      screen.getByRole('progressbar', { name: 'กำลังบันทึก' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('กำลังบันทึก')).toBeOnTheScreen();

    await view.rerender(
      <LoadingOverlay visible={false} message="กำลังบันทึก" />,
    );
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });

  test('กันปุ่ม back ของ Android ระหว่างแสดง และถอด listener เมื่อปิด', async () => {
    const remove = jest.fn();
    const addListener = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation(() => ({ remove }));

    try {
      const view = await renderWithProviders(<LoadingOverlay visible />);

      expect(addListener).toHaveBeenCalledWith(
        'hardwareBackPress',
        expect.any(Function),
      );
      const handler = addListener.mock.calls[0][1];
      // true = กินปุ่ม back ไว้ ไม่ให้ย้อนหน้าระหว่างโหลด
      expect(handler({} as never)).toBe(true);
      expect(remove).not.toHaveBeenCalled();

      await view.rerender(<LoadingOverlay visible={false} />);
      expect(remove).toHaveBeenCalledTimes(1);
    } finally {
      addListener.mockRestore();
    }
  });
});

describe('BottomSheet', () => {
  // mock ของ @gorhom/bottom-sheet render children เสมอ และ present() แค่เก็บ data
  // test นี้จึงยืนยันการต่อสาย ref -> BottomSheetModal และการ render เนื้อหา ไม่ใช่ animation จริง
  // mock เป็น class: spy ที่ prototype เพื่อยืนยันว่า ref ส่งต่อไปถึง BottomSheetModal จริง
  const MockModal = BottomSheetModal as unknown as {
    prototype: { present: () => void; dismiss: () => void };
  };

  test('present() / dismiss() ผ่าน ref ส่งต่อถึง BottomSheetModal และเห็นหัวข้อกับเนื้อหา', async () => {
    const present = jest.spyOn(MockModal.prototype, 'present');
    const dismiss = jest.spyOn(MockModal.prototype, 'dismiss');

    try {
      const ref = createRef<BottomSheetRef>();
      await renderWithProviders(
        <BottomSheet ref={ref} title="ตัวเลือก">
          <Text>เนื้อหาในชีต</Text>
        </BottomSheet>,
      );

      await act(async () => {
        ref.current?.present();
      });
      expect(present).toHaveBeenCalledTimes(1);
      expect(dismiss).not.toHaveBeenCalled();
      expect(
        screen.getByRole('header', { name: 'ตัวเลือก' }),
      ).toBeOnTheScreen();
      expect(screen.getByText('เนื้อหาในชีต')).toBeOnTheScreen();

      await act(async () => {
        ref.current?.dismiss();
      });
      expect(dismiss).toHaveBeenCalledTimes(1);
    } finally {
      present.mockRestore();
      dismiss.mockRestore();
    }
  });
});

describe('OfflineBanner', () => {
  const online = jest.mocked(useNetInfo)();

  afterEach(() => {
    jest.mocked(useNetInfo).mockReturnValue(online);
  });

  test('ออนไลน์: ไม่แสดงอะไร', async () => {
    await renderWithProviders(<OfflineBanner />);

    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  test('ออฟไลน์: แสดงแถบแจ้งเตือน', async () => {
    const offline: NetInfoState = {
      type: NetInfoStateType.none,
      isConnected: false,
      isInternetReachable: false,
      details: null,
    };
    jest.mocked(useNetInfo).mockReturnValue(offline);

    await renderWithProviders(<OfflineBanner />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
    );
  });
});

describe('barrel @/components/ui', () => {
  test('re-export ตัวเดียวกับไฟล์ต้นทาง และโหลดได้โดยไม่มี import วน', () => {
    expect(ui.Screen).toBe(Screen);
    expect(ui.AppHeader).toBe(AppHeader);
    expect(ui.BottomSheet).toBe(BottomSheet);
    expect(ui.LoadingOverlay).toBe(LoadingOverlay);
    expect(ui.OfflineBanner).toBe(OfflineBanner);
    expect(ui.useDialog).toBe(useDialog);
    expect(ui.toast).toBe(toast);
    [
      ui.Text,
      ui.Button,
      ui.Icon,
      ui.Dialog,
      ui.DialogProvider,
      ui.Toast,
      ui.ToastProvider,
      ui.useToast,
      ui.BottomSheetView,
      ui.BottomSheetScrollView,
    ].forEach(value => expect(value).toBeDefined());
  });
});
