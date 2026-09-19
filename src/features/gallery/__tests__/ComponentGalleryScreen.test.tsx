import { screen, userEvent, within } from '@testing-library/react-native';
import React from 'react';

import { Text } from '@/components/ui';
import { GALLERY_SECTIONS } from '@/features/gallery/constants';
import { ComponentGalleryScreen } from '@/features/gallery/screens/ComponentGalleryScreen';
import { i18n } from '@/i18n';
import { useAppSelector } from '@/store/hooks';
import { selectThemePreference } from '@/store/slices/settingsSlice';
import { renderScreen } from '@/test-utils/renderScreen';
import { darkColors, lightColors, ThemeProvider } from '@/theme';
import { isValidThaiNationalId } from '@/utils/validation';

// หน้า gallery ใหญ่ (ทุกคอมโพเนนต์) + พิมพ์ฟอร์มหลายช่อง ใช้เวลามากกว่า test ทั่วไป
jest.setTimeout(30000);

/**
 * ผูก ThemeProvider กับ themePreference ใน store แบบเดียวกับ AppProviders
 * (renderWithProviders ใช้ ThemeProvider แบบ 'system' ตายตัว สลับธีมจาก store ไม่ได้)
 * แสดงค่าใน store ไว้ด้วยเพื่อตรวจว่าปุ่มสลับธีม dispatch จริง
 */
function GalleryWithStoreTheme() {
  const preference = useAppSelector(selectThemePreference);
  return (
    <>
      <ThemeProvider preference={preference}>
        <ComponentGalleryScreen />
      </ThemeProvider>
      <Text testID="store-theme">{preference}</Text>
    </>
  );
}

async function renderGallery() {
  await renderScreen(GalleryWithStoreTheme, { routeName: 'ComponentGallery' });
}

// i18n เป็น singleton: test เปลี่ยนภาษาแล้วต้องคืนเป็นไทยให้ test ถัดไป
afterEach(async () => {
  await i18n.changeLanguage('th');
});

describe('ComponentGalleryScreen', () => {
  test('แสดงตัวสลับธีม / ภาษา และครบทุก section', async () => {
    await renderGallery();

    expect(screen.getByTestId('gallery-scroll')).toBeOnTheScreen();
    expect(screen.getByTestId('gallery-theme')).toBeOnTheScreen();
    expect(screen.getByTestId('gallery-lang-th')).toBeOnTheScreen();
    expect(screen.getByTestId('gallery-lang-en')).toBeOnTheScreen();
    for (const name of GALLERY_SECTIONS) {
      expect(screen.getByTestId(`gallery-section-${name}`)).toBeOnTheScreen();
    }
    // ชื่อไทยใช้ตัวอักษรย่อจากพยัญชนะตัวแรกของชื่อและนามสกุล
    expect(
      within(screen.getByTestId('gallery-avatar-thai-md')).getByText('สจ'),
    ).toBeOnTheScreen();
  });

  test('สลับเป็นธีมมืดแล้ว store เปลี่ยนและค่าสีของ swatch เป็นค่าของธีมมืด', async () => {
    const user = userEvent.setup();
    await renderGallery();

    const swatch = () => screen.getByTestId('gallery-swatch-background');
    expect(screen.getByTestId('store-theme')).toHaveTextContent('system');
    expect(
      within(swatch()).getByText(lightColors.background),
    ).toBeOnTheScreen();

    await user.press(
      within(screen.getByTestId('gallery-theme')).getByRole('tab', {
        name: 'มืด',
      }),
    );

    expect(screen.getByTestId('store-theme')).toHaveTextContent('dark');
    expect(within(swatch()).getByText(darkColors.background)).toBeOnTheScreen();
    expect(
      within(swatch()).queryByText(lightColors.background),
    ).not.toBeOnTheScreen();
    expect(
      within(screen.getByTestId('gallery-theme')).getByRole('tab', {
        name: 'มืด',
      }),
    ).toBeSelected();
  });

  test('ปุ่ม toast แต่ละประเภทแสดง toast ข้อความของตัวเอง', async () => {
    const user = userEvent.setup();
    await renderGallery();

    const cases = [
      ['gallery-toast-success', 'บันทึกการเปลี่ยนแปลงเรียบร้อย'],
      ['gallery-toast-error', 'ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง'],
      ['gallery-toast-info', 'มีเวอร์ชันใหม่ให้อัปเดตแล้ว'],
      ['gallery-toast-warning', 'แบตเตอรี่เหลือน้อย อาจอัปโหลดไม่เสร็จ'],
    ] as const;

    for (const [testID, message] of cases) {
      expect(screen.queryByText(message)).not.toBeOnTheScreen();
      await user.press(screen.getByTestId(testID));
      expect(await screen.findByText(message)).toBeOnTheScreen();
    }
  });

  test('dialog ยืนยัน: กดยืนยันแล้วแสดงผลลัพธ์ด้วย toast', async () => {
    const user = userEvent.setup();
    await renderGallery();

    await user.press(screen.getByTestId('gallery-dialog-confirm'));
    expect(await screen.findByText('ออกจากหน้านี้?')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'ยืนยัน' }));

    expect(await screen.findByText('ผลลัพธ์: ยืนยัน')).toBeOnTheScreen();
    expect(screen.queryByText('ออกจากหน้านี้?')).not.toBeOnTheScreen();
  });

  test('dialog ลบ (destructive): กดยกเลิกแล้วได้ผลลัพธ์ยกเลิก', async () => {
    const user = userEvent.setup();
    await renderGallery();

    await user.press(screen.getByTestId('gallery-dialog-destructive'));
    expect(await screen.findByText('ลบที่อยู่นี้?')).toBeOnTheScreen();
    // ปุ่มยืนยันของ dialog ลบใช้คำว่า "ลบ" แทน "ยืนยัน"
    expect(screen.getByRole('button', { name: 'ลบ' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'ยกเลิก' }));

    expect(await screen.findByText('ผลลัพธ์: ยกเลิก')).toBeOnTheScreen();
  });

  test('ส่งฟอร์มว่างแล้วเห็นข้อความผิดพลาดที่แปลแล้วของทุกช่อง', async () => {
    const user = userEvent.setup();
    await renderGallery();

    await user.press(screen.getByTestId('gallery-form-submit'));

    const form = within(screen.getByTestId('gallery-section-form'));
    expect(await form.findByText('กรุณากรอกชื่อ-นามสกุล')).toBeOnTheScreen();
    expect(form.getByText('กรุณากรอกอีเมล')).toBeOnTheScreen();
    expect(form.getByText('กรุณากรอกเบอร์มือถือ')).toBeOnTheScreen();
    expect(form.getByText('กรุณากรอกเลขบัตรประชาชน')).toBeOnTheScreen();
    expect(form.getByText('กรุณาเลือกจังหวัดที่อยู่')).toBeOnTheScreen();
    expect(form.getByText('กรุณากรอกรหัสผ่าน')).toBeOnTheScreen();
    expect(form.getByText('กรุณากรอกรหัสผ่านอีกครั้ง')).toBeOnTheScreen();
    expect(form.getByText('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก')).toBeOnTheScreen();
    expect(form.getByText('กรุณายอมรับข้อกำหนดการใช้งาน')).toBeOnTheScreen();
    expect(screen.queryByText('ส่งฟอร์มเรียบร้อย')).not.toBeOnTheScreen();
  });

  test('ข้อมูลผิดรูปแบบได้ข้อความเฉพาะช่อง แก้ครบแล้วส่งได้และมี toast สรุปค่า', async () => {
    const user = userEvent.setup();
    const nationalId = '1234567890121';
    // กันเลขตัวอย่างผิด checksum (test จะพังด้วยเหตุผลที่ไม่เกี่ยวกับหน้าจอ)
    expect(isValidThaiNationalId(nationalId)).toBe(true);
    await renderGallery();

    const form = within(screen.getByTestId('gallery-section-form'));

    await user.type(form.getByLabelText('ชื่อ-นามสกุล'), 'สมชาย ใจดี');
    await user.type(form.getByLabelText('อีเมล'), 'somchai@');
    await user.type(form.getByLabelText('เบอร์มือถือ'), '0212345678');
    await user.type(form.getByLabelText('เลขบัตรประชาชน'), '1234567890123');
    await user.type(form.getByLabelText('รหัสผ่าน'), 'password123');
    await user.type(form.getByLabelText('รหัสผ่านอีกครั้ง'), 'password999');
    await user.press(screen.getByTestId('gallery-form-submit'));

    expect(await form.findByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeOnTheScreen();
    expect(
      form.getByText(
        'เบอร์มือถือต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09',
      ),
    ).toBeOnTheScreen();
    expect(form.getByText('เลขบัตรประชาชนไม่ถูกต้อง')).toBeOnTheScreen();
    expect(form.getByText('รหัสผ่านไม่ตรงกัน')).toBeOnTheScreen();

    await user.clear(form.getByLabelText('อีเมล'));
    await user.type(form.getByLabelText('อีเมล'), 'somchai@example.com');
    await user.clear(form.getByLabelText('เบอร์มือถือ'));
    await user.type(form.getByLabelText('เบอร์มือถือ'), '0812345678');
    await user.clear(form.getByLabelText('เลขบัตรประชาชน'));
    await user.type(form.getByLabelText('เลขบัตรประชาชน'), nationalId);
    await user.clear(form.getByLabelText('รหัสผ่านอีกครั้ง'));
    await user.type(form.getByLabelText('รหัสผ่านอีกครั้ง'), 'password123');
    // mock ของ bottom-sheet render ตัวเลือกไว้ตลอด จึงกดตัวเลือกในฟอร์มได้ทันที
    await user.press(form.getByRole('button', { name: 'จังหวัดที่อยู่' }));
    await user.press(form.getByRole('radio', { name: 'เชียงใหม่' }));
    await user.type(form.getByTestId('gallery-form-otp'), '123456');
    await user.press(
      form.getByRole('checkbox', {
        name: 'ยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว',
      }),
    );
    await user.press(screen.getByTestId('gallery-form-submit'));

    expect(await screen.findByText('ส่งฟอร์มเรียบร้อย')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'สมชาย ใจดี · somchai@example.com · 081-234-5678 · เชียงใหม่',
      ),
    ).toBeOnTheScreen();
  });

  test('สลับเป็นภาษาอังกฤษแล้วหัวข้อ section เป็นภาษาอังกฤษ', async () => {
    const user = userEvent.setup();
    await renderGallery();

    const typography = within(screen.getByTestId('gallery-section-typography'));
    expect(typography.getByText('ตัวอักษร')).toBeOnTheScreen();
    expect(screen.getByTestId('gallery-lang-th')).toBeSelected();

    await user.press(screen.getByTestId('gallery-lang-en'));

    expect(await typography.findByText('Typography')).toBeOnTheScreen();
    expect(typography.queryByText('ตัวอักษร')).not.toBeOnTheScreen();
    expect(screen.getByText('Colors')).toBeOnTheScreen();
    expect(screen.getByText('Feedback')).toBeOnTheScreen();
    expect(screen.getByTestId('gallery-lang-en')).toBeSelected();
    expect(screen.getByTestId('gallery-lang-th')).not.toBeSelected();
  });
});
