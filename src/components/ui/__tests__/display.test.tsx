import {
  act,
  fireEvent,
  screen,
  userEvent,
  within,
} from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';

import { Accordion } from '@/components/ui/Accordion';
import { AppImage } from '@/components/ui/AppImage';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, CountBadge, formatBadgeCount } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconButton } from '@/components/ui/IconButton';
import { ListItem } from '@/components/ui/ListItem';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Section } from '@/components/ui/Section';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { i18n } from '@/i18n';
import { ApiError } from '@/services/api/errors';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { getInitials } from '@/utils/format';

describe('Badge', () => {
  it('แสดงข้อความของ badge', async () => {
    await renderWithProviders(
      <Badge label="ชำระแล้ว" status="success" variant="solid" icon="check" />,
    );
    expect(screen.getByText('ชำระแล้ว')).toBeOnTheScreen();
  });

  it('จำนวนเกิน max แสดงเป็น 99+', async () => {
    expect(formatBadgeCount(5)).toBe('5');
    expect(formatBadgeCount(120)).toBe('99+');
    expect(formatBadgeCount(0)).toBe('0');

    await renderWithProviders(<CountBadge count={150} />);
    expect(screen.getByText('99+')).toBeOnTheScreen();
  });

  it('CountBadge ไม่แสดงเมื่อ count = 0', async () => {
    await renderWithProviders(<CountBadge count={0} testID="count" />);
    expect(screen.queryByTestId('count')).not.toBeOnTheScreen();
  });

  it('badge ที่มีแต่ icon (ไม่มีข้อความ) ซ่อนจาก screen reader ส่วนที่มีข้อความอ่านได้', async () => {
    await renderWithProviders(
      <>
        <Badge icon="star" testID="icon-only" />
        <Badge label="ใหม่" testID="labelled" />
      </>,
    );
    expect(screen.queryByTestId('icon-only')).not.toBeOnTheScreen();
    expect(
      screen.getByTestId('icon-only', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('labelled')).toHaveAccessibleName('ใหม่');
  });

  it('CountBadge ใช้ minHeight ไม่ใช่ height ตายตัว (ตัวอักษรขยายตามระบบได้)', async () => {
    await renderWithProviders(<CountBadge count={3} testID="count" />);
    const badge = screen.getByTestId('count');
    expect(badge).toHaveStyle({ minHeight: 24 });
    expect(badge).not.toHaveStyle({ height: 24 });
  });
});

describe('Avatar', () => {
  it('โหลดรูปไม่ได้ -> แสดงตัวอักษรย่อแทน', async () => {
    await renderWithProviders(
      <Avatar
        testID="avatar"
        uri="https://example.com/broken.png"
        name="สมชาย ใจดี"
      />,
    );
    const image = screen.getByTestId('avatar-image');
    expect(image).toBeOnTheScreen();

    await fireEvent(image, 'error');

    expect(screen.queryByTestId('avatar-image')).not.toBeOnTheScreen();
    expect(screen.getByText(getInitials('สมชาย ใจดี'))).toBeOnTheScreen();
    expect(screen.getByLabelText('สมชาย ใจดี')).toBeOnTheScreen();
  });

  it('ไม่มีรูป -> ตัวอักษรย่อ (xs ใช้ตัวเดียว)', async () => {
    await renderWithProviders(
      <>
        <Avatar name="Jane Doe" />
        <Avatar name="John Smith" size="xs" />
      </>,
    );
    expect(screen.getByText('JD')).toBeOnTheScreen();
    expect(screen.getByText('J')).toBeOnTheScreen();
  });
});

describe('ListItem', () => {
  it('กดแล้วเรียก onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <ListItem
        title="การแจ้งเตือน"
        subtitle="เปิดรับข่าวสารและโปรโมชันจากร้านค้าที่ติดตามไว้ทั้งหมด"
        left="bell"
        value="เปิด"
        chevron
        onPress={onPress}
      />,
    );
    await userEvent.press(screen.getByRole('button', { name: /การแจ้งเตือน/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled กดไม่ได้', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <ListItem title="ลบบัญชี" destructive disabled onPress={onPress} />,
    );
    const row = screen.getByRole('button', { name: 'ลบบัญชี' });
    expect(row).toBeDisabled();
    await userEvent.press(row);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('ErrorState', () => {
  beforeEach(() => {
    jest
      .mocked(AccessibilityInfo.announceForAccessibilityWithOptions)
      .mockClear();
  });

  it('แสดงข้อความ network ที่แปลแล้ว และกดลองอีกครั้งได้', async () => {
    const onRetry = jest.fn();
    const error = new ApiError({ kind: 'network', message: 'Network Error' });
    await renderWithProviders(<ErrorState error={error} onRetry={onRetry} />);

    expect(screen.getByText(i18n.t('errors:title'))).toBeOnTheScreen();
    expect(screen.getByText(i18n.t('errors:network'))).toBeOnTheScreen();
    // ประกาศ error ให้ screen reader ทั้ง iOS / Android
    expect(
      AccessibilityInfo.announceForAccessibilityWithOptions,
    ).toHaveBeenCalledWith(
      `${i18n.t('errors:title')}, ${i18n.t('errors:network')}`,
      { queue: true },
    );

    await userEvent.press(
      screen.getByRole('button', { name: i18n.t('common:retry') }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('error ทั่วไป -> ข้อความ unknown และไม่มีปุ่มเมื่อไม่ส่ง onRetry', async () => {
    await renderWithProviders(<ErrorState error={new Error('boom')} />);
    expect(screen.getByText(i18n.t('errors:unknown'))).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: i18n.t('common:retry') }),
    ).not.toBeOnTheScreen();
  });
});

describe('EmptyState', () => {
  it('แสดงหัวข้อ คำอธิบาย และกดปุ่ม action ได้', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <EmptyState
        icon="shopping-cart"
        title="ยังไม่มีสินค้าในตะกร้า"
        description="เลือกสินค้าที่ชอบแล้วกดเพิ่มลงตะกร้า"
        actionLabel="เลือกซื้อสินค้า"
        actionIcon="shopping-bag"
        onAction={onAction}
      />,
    );
    expect(screen.getByText('ยังไม่มีสินค้าในตะกร้า')).toBeOnTheScreen();
    expect(
      screen.getByText('เลือกสินค้าที่ชอบแล้วกดเพิ่มลงตะกร้า'),
    ).toBeOnTheScreen();

    await userEvent.press(
      screen.getByRole('button', { name: 'เลือกซื้อสินค้า' }),
    );
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('ไม่ใส่ title -> ใช้ common:noData และไม่ประกาศเมื่อไม่ได้เปิด announce', async () => {
    jest
      .mocked(AccessibilityInfo.announceForAccessibilityWithOptions)
      .mockClear();
    await renderWithProviders(<EmptyState />);
    expect(screen.getByText(i18n.t('common:noData'))).toBeOnTheScreen();
    expect(
      AccessibilityInfo.announceForAccessibilityWithOptions,
    ).not.toHaveBeenCalled();
  });
});

describe('Accordion', () => {
  it('กดหัวข้อแล้วสลับ expanded และแสดง / ซ่อนเนื้อหา', async () => {
    const onExpandedChange = jest.fn();
    await renderWithProviders(
      <Accordion title="วิธีการจัดส่ง" onExpandedChange={onExpandedChange}>
        <Text>จัดส่งภายใน 3 วันทำการ</Text>
      </Accordion>,
    );

    const header = screen.getByRole('button', {
      name: 'วิธีการจัดส่ง',
      expanded: false,
    });
    expect(screen.queryByText('จัดส่งภายใน 3 วันทำการ')).not.toBeOnTheScreen();

    await userEvent.press(header);
    expect(
      screen.getByRole('button', { name: 'วิธีการจัดส่ง', expanded: true }),
    ).toBeOnTheScreen();
    expect(screen.getByText('จัดส่งภายใน 3 วันทำการ')).toBeOnTheScreen();
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);

    await userEvent.press(header);
    expect(
      screen.getByRole('button', { name: 'วิธีการจัดส่ง', expanded: false }),
    ).toBeOnTheScreen();
    expect(screen.queryByText('จัดส่งภายใน 3 วันทำการ')).not.toBeOnTheScreen();
  });
});

describe('Skeleton / ProgressBar (reanimated)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('render skeleton ทุก variant และ SkeletonList ประกาศว่ากำลังโหลด', async () => {
    await renderWithProviders(
      <>
        <Skeleton variant="text" lines={3} testID="sk-text" />
        <Skeleton variant="circle" testID="sk-circle" />
        <Skeleton variant="rect" height={80} testID="sk-rect" />
        <SkeletonList count={3} />
      </>,
    );
    // skeleton เดี่ยวซ่อนจาก screen reader จึงต้องค้นรวม element ที่ซ่อน
    const hidden = { includeHiddenElements: true };
    expect(screen.getByTestId('sk-text', hidden)).toBeOnTheScreen();
    expect(screen.queryByTestId('sk-text')).not.toBeOnTheScreen();
    expect(screen.getByTestId('sk-circle', hidden)).toBeOnTheScreen();
    expect(screen.getByTestId('sk-rect', hidden)).toBeOnTheScreen();
    expect(
      screen.getByRole('progressbar', { name: i18n.t('common:loading') }),
    ).toBeOnTheScreen();
  });

  it('ProgressBar บอกค่าเป็นเปอร์เซ็นต์ และ animate แถบไปยังค่าใหม่', async () => {
    jest.useFakeTimers();
    const { rerender } = await renderWithProviders(
      <ProgressBar
        value={0.5}
        testID="progress"
        accessibilityLabel="อัปโหลด"
      />,
    );
    const bar = screen.getByTestId('progress');
    expect(bar).toHaveAccessibilityValue({ min: 0, max: 100, now: 50 });

    await fireEvent(bar, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 4 } },
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    // เต็มราง 200 ที่ 50% = เลื่อนซ้ายไป 100
    const fill = bar.children[0];
    expect(fill).toHaveAnimatedStyle({
      width: 200,
      transform: [{ translateX: -100 }],
    });

    await rerender(
      <ProgressBar value={2} testID="progress" accessibilityLabel="อัปโหลด" />,
    );
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('progress')).toHaveAccessibilityValue({
      now: 100,
    });
    expect(fill).toHaveAnimatedStyle({ transform: [{ translateX: 0 }] });
  });

  it('ProgressBar indeterminate ประกาศสถานะ busy', async () => {
    await renderWithProviders(<ProgressBar indeterminate testID="loading" />);
    const bar = screen.getByTestId('loading');
    expect(bar).toBeBusy();
    expect(bar).toHaveAccessibleName(i18n.t('common:loading'));
  });
});

describe('Chip / IconButton / Card / AppImage', () => {
  it('Chip ประกาศ selected และกดปุ่มลบแยกจากตัว chip ได้', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await renderWithProviders(
      <Chip
        label="ลดราคา"
        selected
        onPress={onPress}
        onRemove={onRemove}
        testID="chip"
      />,
    );
    const chip = screen.getByRole('button', { name: 'ลดราคา' });
    expect(chip).toBeSelected();
    // ปุ่ม x ต้องไม่อยู่ข้างในส่วนที่ accessible ของ chip (VoiceOver จะเข้าไม่ถึง)
    expect(within(chip).queryByTestId('chip-remove')).toBeNull();

    await userEvent.press(
      screen.getByRole('button', { name: `${i18n.t('common:delete')} ลดราคา` }),
    );
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    await userEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);

    // พื้นที่แตะ 44: native ตัด hitSlop ของลูกที่ขอบ parent จึงต้องมี slop ทั้งกรอบนอก (36 + 4 * 2)
    // และส่วนที่กดได้ด้านใน (34 + 5 * 2)
    expect(chip.parent?.props.hitSlop).toBe(4);
    expect(chip.props.hitSlop).toBe(5);
    expect(screen.getByTestId('chip-remove').props.hitSlop).toBe(5);
  });

  it('Chip disabled กดไม่ได้ทั้งตัวและปุ่ม x', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await renderWithProviders(
      <Chip
        label="ส่งฟรี"
        disabled
        onPress={onPress}
        onRemove={onRemove}
        testID="chip"
      />,
    );
    expect(screen.getByTestId('chip')).toBeDisabled();
    expect(screen.getByTestId('chip-remove')).toBeDisabled();
    await userEvent.press(screen.getByTestId('chip'));
    await userEvent.press(screen.getByTestId('chip-remove'));
    expect(onPress).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('IconButton ใช้ accessibilityLabel เป็นชื่อปุ่ม', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <IconButton
        icon="bell"
        accessibilityLabel="การแจ้งเตือน"
        onPress={onPress}
      />,
    );
    await userEvent.press(screen.getByRole('button', { name: 'การแจ้งเตือน' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('IconButton รวม accessibilityState ที่ส่งมากับ disabled / loading', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <>
        <IconButton
          icon="heart"
          accessibilityLabel="ถูกใจ"
          accessibilityState={{ selected: true }}
          disabled
          onPress={onPress}
        />
        <IconButton
          icon="refresh-cw"
          accessibilityLabel="รีเฟรช"
          loading
          onPress={onPress}
        />
      </>,
    );
    const toggle = screen.getByRole('button', { name: 'ถูกใจ' });
    expect(toggle).toBeSelected();
    expect(toggle).toBeDisabled();

    const busy = screen.getByRole('button', { name: 'รีเฟรช' });
    expect(busy).toBeBusy();
    expect(busy).toBeDisabled();
    await userEvent.press(busy);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Card ที่มี onPress กดได้ ส่วนที่ไม่มีเป็นแค่กล่อง', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <>
        <Card onPress={onPress} accessibilityLabel="คำสั่งซื้อล่าสุด">
          <Text>ORD-001</Text>
        </Card>
        <Card header={<Text>หัวการ์ด</Text>}>
          <Text>เนื้อหา</Text>
        </Card>
      </>,
    );
    await userEvent.press(
      screen.getByRole('button', { name: 'คำสั่งซื้อล่าสุด' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('Card ที่ children เป็น false ไม่มีกล่องเนื้อหาว่าง', async () => {
    const showBody = false;
    await renderWithProviders(
      <Card testID="card">{showBody && <Text>ซ่อน</Text>}</Card>,
    );
    expect(screen.getByTestId('card').children).toHaveLength(0);
  });

  it('Section แสดงหัวข้อเป็น header และกดลิงก์ action ได้ / ไม่มี onAction ไม่มีปุ่ม', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <>
        <Section
          title="สินค้าแนะนำ"
          actionLabel={i18n.t('common:seeAll')}
          onAction={onAction}
        >
          <Text>รายการ</Text>
        </Section>
        <Section actionLabel="ไม่มีปุ่ม" testID="no-action">
          <Text>เนื้อหา</Text>
        </Section>
      </>,
    );
    expect(
      screen.getByRole('header', { name: 'สินค้าแนะนำ' }),
    ).toBeOnTheScreen();
    await userEvent.press(
      screen.getByRole('button', {
        name: `${i18n.t('common:seeAll')} สินค้าแนะนำ`,
      }),
    );
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('ไม่มีปุ่ม')).not.toBeOnTheScreen();
    // ไม่มี header ว่าง: มีแค่ children ตัวเดียว
    expect(screen.getByTestId('no-action').children).toHaveLength(1);
  });

  it('AppImage แสดง placeholder เมื่อโหลดไม่ได้ และมี label ของรูป', async () => {
    await renderWithProviders(
      <AppImage
        testID="photo"
        uri="https://example.com/broken.jpg"
        aspectRatio={16 / 9}
        accessibilityLabel="รูปสินค้า"
      />,
    );
    expect(screen.getByLabelText('รูปสินค้า')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('photo-image'), 'error');
    expect(screen.queryByTestId('photo-image')).not.toBeOnTheScreen();
  });
});
