import { zodResolver } from '@hookform/resolvers/zod';
import {
  act,
  fireEvent,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormTextField } from '@/components/ui/form/FormTextField';
import { OTPInput } from '@/components/ui/OTPInput';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { TextField } from '@/components/ui/TextField';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { INVISIBLE_TEXT_COLOR } from '@/theme';

// mock ของ bottom-sheet (jest/setup.js) เป็น class: spy present / dismiss ได้ที่ prototype
type SheetModalMock = {
  prototype: { present: () => void; dismiss: () => void };
};
const { BottomSheetModal: SheetModal } = jest.requireMock<{
  BottomSheetModal: SheetModalMock;
}>('@gorhom/bottom-sheet');

describe('TextField', () => {
  test('พิมพ์ข้อความแล้วเรียก onChangeText', async () => {
    const user = userEvent.setup();
    const onChangeText = jest.fn();
    await renderWithProviders(
      <TextField
        label="ชื่อ"
        placeholder="ชื่อจริง"
        onChangeText={onChangeText}
      />,
    );

    const input = screen.getByLabelText('ชื่อ');
    await user.type(input, 'สมชาย');

    expect(onChangeText).toHaveBeenLastCalledWith('สมชาย');
    expect(input).toHaveDisplayValue('สมชาย');
  });

  test('ปุ่มล้างแสดงเมื่อมีข้อความ และกดแล้วข้อความหายไป', async () => {
    const user = userEvent.setup();
    const onChangeText = jest.fn();
    await renderWithProviders(
      <TextField
        label="ค้นหาสินค้า"
        clearable
        clearLabel="ล้างข้อความ"
        onChangeText={onChangeText}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'ล้างข้อความ' }),
    ).not.toBeOnTheScreen();

    const input = screen.getByLabelText('ค้นหาสินค้า');
    await user.type(input, 'abc');
    await user.press(screen.getByRole('button', { name: 'ล้างข้อความ' }));

    expect(onChangeText).toHaveBeenLastCalledWith('');
    expect(input).toHaveDisplayValue('');
    expect(
      screen.queryByRole('button', { name: 'ล้างข้อความ' }),
    ).not.toBeOnTheScreen();
  });

  test('type="password" ซ่อนข้อความ และปุ่มรูปตาสลับแสดง/ซ่อน', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <TextField
        label="รหัสผ่าน"
        type="password"
        showPasswordLabel="แสดงรหัสผ่าน"
        hidePasswordLabel="ซ่อนรหัสผ่าน"
      />,
    );

    const input = screen.getByLabelText('รหัสผ่าน');
    expect(input).toHaveProp('secureTextEntry', true);

    await user.press(
      screen.getByRole('togglebutton', { name: 'แสดงรหัสผ่าน' }),
    );
    expect(input).toHaveProp('secureTextEntry', false);

    const hideButton = screen.getByRole('togglebutton', {
      name: 'ซ่อนรหัสผ่าน',
    });
    // toBeChecked ของ RNTL ไม่รองรับ role togglebutton (RN ใช้ checked กับ togglebutton ตามเอกสาร)
    expect(hideButton).toHaveProp('accessibilityState', {
      checked: true,
      disabled: false,
    });
    await user.press(hideButton);
    expect(input).toHaveProp('secureTextEntry', true);
  });

  test('errorText แสดงแทน helperText และประกาศเป็น alert', async () => {
    await renderWithProviders(
      <TextField
        label="อีเมล"
        helperText="ใช้สำหรับเข้าสู่ระบบ"
        errorText="รูปแบบอีเมลไม่ถูกต้อง"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'รูปแบบอีเมลไม่ถูกต้อง',
    );
    expect(screen.queryByText('ใช้สำหรับเข้าสู่ระบบ')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('อีเมล')).toHaveProp(
      'accessibilityHint',
      'รูปแบบอีเมลไม่ถูกต้อง',
    );
  });

  test('disabled แก้ไขไม่ได้', async () => {
    await renderWithProviders(<TextField label="รหัสสาขา" disabled />);
    expect(screen.getByLabelText('รหัสสาขา')).toBeDisabled();
  });
});

describe('Checkbox', () => {
  function CheckboxHarness() {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="ยอมรับข้อกำหนดการใช้งาน"
        checked={checked}
        onChange={setChecked}
      />
    );
  }

  test('กดแล้วสลับสถานะ checked', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<CheckboxHarness />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'ยอมรับข้อกำหนดการใช้งาน',
    });
    expect(checkbox).not.toBeChecked();

    await user.press(checkbox);
    expect(checkbox).toBeChecked();

    await user.press(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('indeterminate = mixed และกดแล้วเป็น true', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithProviders(
      <Checkbox
        label="เลือกทั้งหมด"
        checked={false}
        indeterminate
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'เลือกทั้งหมด' });
    expect(checkbox).toBePartiallyChecked();
    await user.press(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('disabled กดไม่ได้', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithProviders(
      <Checkbox
        label="รับข่าวสาร"
        checked={false}
        disabled
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'รับข่าวสาร' });
    expect(checkbox).toBeDisabled();
    await user.press(checkbox);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RadioGroup', () => {
  type Plan = 'monthly' | 'yearly' | 'lifetime';

  function RadioHarness({ onChange }: { onChange: (value: Plan) => void }) {
    const [value, setValue] = useState<Plan>('monthly');
    return (
      <RadioGroup<Plan>
        label="แพ็กเกจ"
        value={value}
        onChange={next => {
          onChange(next);
          setValue(next);
        }}
        options={[
          { label: 'รายเดือน', value: 'monthly' },
          { label: 'รายปี', value: 'yearly', description: 'ประหยัด 20%' },
          { label: 'ตลอดชีพ', value: 'lifetime', disabled: true },
        ]}
      />
    );
  }

  test('เลือกตัวเลือกแล้วเรียก onChange และสถานะ checked ย้ายตาม', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithProviders(<RadioHarness onChange={onChange} />);

    expect(screen.getByRole('radio', { name: 'รายเดือน' })).toBeChecked();

    await user.press(screen.getByRole('radio', { name: 'รายปี' }));

    expect(onChange).toHaveBeenCalledWith('yearly');
    expect(screen.getByRole('radio', { name: 'รายปี' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'รายเดือน' })).not.toBeChecked();
  });

  test('ตัวเลือกที่ disabled กดไม่ได้', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithProviders(<RadioHarness onChange={onChange} />);

    const lifetime = screen.getByRole('radio', { name: 'ตลอดชีพ' });
    expect(lifetime).toBeDisabled();
    await user.press(lifetime);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('SegmentedControl', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('กดแท็บแล้วเปลี่ยนค่า และแถบเลือกเลื่อนไปช่องใหม่ด้วย reanimated', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = jest.fn();

    function SegmentHarness() {
      const [value, setValue] = useState<'day' | 'month'>('day');
      return (
        <SegmentedControl
          testID="period"
          value={value}
          onChange={next => {
            onChange(next);
            setValue(next);
          }}
          options={[
            { label: 'รายวัน', value: 'day' },
            { label: 'รายเดือน', value: 'month' },
          ]}
        />
      );
    }

    await renderWithProviders(<SegmentHarness />);

    // test renderer ไม่วัด layout: ส่ง onLayout เองเพื่อให้แถบเลือก (Animated.View) ถูก render
    // RNTL v14 fireEvent เป็น async ต้อง await (กฎนี้ของ eslint-plugin-testing-library ยังเข้าใจว่า sync)
    await fireEvent(screen.getByTestId('period'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 48 } },
    });

    const indicator = screen.getByTestId('period-indicator');
    // วัดขนาดครั้งแรก: วางที่ช่องแรกทันที
    expect(indicator).toHaveAnimatedStyle({ transform: [{ translateX: 0 }] });
    expect(screen.getByRole('tab', { name: 'รายวัน' })).toBeSelected();

    await user.press(screen.getByRole('tab', { name: 'รายเดือน' }));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(onChange).toHaveBeenCalledWith('month');
    expect(screen.getByRole('tab', { name: 'รายเดือน' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'รายวัน' })).not.toBeSelected();
    // (300 - padding 2 x 2) / 2 ช่อง = 148
    expect(indicator).toHaveAnimatedStyle({ transform: [{ translateX: 148 }] });
  });

  test('value ไม่ตรงกับตัวเลือกใด: ไม่แสดงแถบเลือก', async () => {
    await renderWithProviders(
      <SegmentedControl
        testID="filter"
        value="none"
        onChange={jest.fn()}
        options={[
          { label: 'ทั้งหมด', value: 'a' },
          { label: 'ยังไม่อ่าน', value: 'b' },
        ]}
      />,
    );
    await fireEvent(screen.getByTestId('filter'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 48 } },
    });

    expect(screen.queryByTestId('filter-indicator')).not.toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'ทั้งหมด' })).not.toBeSelected();
  });

  test('กดแท็บที่เลือกอยู่แล้วไม่เรียก onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await renderWithProviders(
      <SegmentedControl
        value="a"
        onChange={onChange}
        options={[
          { label: 'ทั้งหมด', value: 'a' },
          { label: 'ยังไม่อ่าน', value: 'b' },
        ]}
      />,
    );

    await user.press(screen.getByRole('tab', { name: 'ทั้งหมด' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('OTPInput', () => {
  test('พิมพ์ครบ 6 หลักแล้วเรียก onComplete ครั้งเดียว', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    await renderWithProviders(
      <OTPInput label="รหัส OTP" onComplete={onComplete} />,
    );

    const input = screen.getByLabelText('รหัส OTP');
    await user.type(input, '12345');
    expect(onComplete).not.toHaveBeenCalled();

    await user.type(input, '6');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(input).toHaveDisplayValue('123456');

    // พิมพ์เกินจำนวนหลัก: ค่าไม่เปลี่ยนและไม่เรียก onComplete ซ้ำ
    await user.type(input, '7');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(input).toHaveDisplayValue('123456');
  });

  test('วางรหัสที่มีช่องว่างคั่น (เช่นจาก SMS) ครบ 6 หลัก', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    await renderWithProviders(
      <OTPInput label="รหัส OTP" onComplete={onComplete} />,
    );

    const input = screen.getByLabelText('รหัส OTP');
    // user.paste ของ RNTL ไม่จำลอง maxLength แต่ native (iOS / Android) ตัดข้อความที่วางตาม maxLength
    // ก่อนถึง JS: ถ้ามี maxLength="6" จะได้ "123 45" -> 5 หลัก จึงต้องไม่มี prop นี้
    expect(input).not.toHaveProp('maxLength');
    await user.paste(input, '123 456');

    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  test('วางรหัสที่มีตัวอักษรอื่นปน: เก็บเฉพาะตัวเลขและตัดส่วนเกิน', async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    const onChange = jest.fn();
    await renderWithProviders(
      <OTPInput
        label="รหัส OTP"
        length={4}
        onChange={onChange}
        onComplete={onComplete}
      />,
    );

    await user.paste(screen.getByLabelText('รหัส OTP'), '12-34 99');

    expect(onChange).toHaveBeenLastCalledWith('1234');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  test('ช่องที่ซ่อนไว้ไม่ใช้สีข้อความ transparent (Android วาดเป็นสีดำทับกล่องแรก)', async () => {
    await renderWithProviders(<OTPInput label="รหัส OTP" value="1221" />);

    const input = screen.getByLabelText('รหัส OTP');
    expect(input).toHaveStyle({ color: INVISIBLE_TEXT_COLOR });
    expect(input).not.toHaveStyle({ color: 'transparent' });
  });
});

describe('Select', () => {
  test('เลือกตัวเลือกจาก sheet แล้วช่องแสดงค่าที่เลือก', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    function SelectHarness() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <Select
          label="จังหวัด"
          value={value}
          onChange={next => {
            onChange(next);
            setValue(next);
          }}
          options={[
            { label: 'กรุงเทพมหานคร', value: 'bkk' },
            { label: 'เชียงใหม่', value: 'cnx' },
          ]}
        />
      );
    }

    const present = jest.spyOn(SheetModal.prototype, 'present');
    const dismiss = jest.spyOn(SheetModal.prototype, 'dismiss');
    await renderWithProviders(<SelectHarness />);

    const trigger = screen.getByRole('button', { name: 'จังหวัด' });
    // ยังไม่เลือก: แสดง placeholder ค่าเริ่มต้น common:select
    expect(trigger).toHaveTextContent('เลือก');
    expect(trigger).toBeCollapsed();

    await user.press(trigger);
    expect(present).toHaveBeenCalledTimes(1);
    expect(trigger).toBeExpanded();

    // mock ของ bottom-sheet render เนื้อหา sheet ตลอด จึงกดตัวเลือกได้ทันที
    await user.press(screen.getByRole('radio', { name: 'เชียงใหม่' }));

    expect(onChange).toHaveBeenCalledWith('cnx');
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveTextContent('เชียงใหม่');
    expect(screen.getByRole('radio', { name: 'เชียงใหม่' })).toBeChecked();

    present.mockRestore();
    dismiss.mockRestore();
  });
});

describe('Switch', () => {
  function SwitchHarness() {
    const [on, setOn] = useState(false);
    return <Switch label="การแจ้งเตือน" value={on} onValueChange={setOn} />;
  }

  test('กดที่ข้อความของแถวแล้วสลับค่า และ screen reader อ่านชื่อจาก label', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SwitchHarness />);

    const control = screen.getByRole('switch', { name: 'การแจ้งเตือน' });
    expect(control).not.toBeChecked();

    // label ถูกซ่อนจาก screen reader (Switch ประกาศชื่อเอง) จึงต้อง includeHiddenElements
    await user.press(
      screen.getByText('การแจ้งเตือน', { includeHiddenElements: true }),
    );
    expect(control).toBeChecked();
  });

  test('Switch ตัวเดียวสลับค่าผ่าน onValueChange', async () => {
    const onValueChange = jest.fn();
    await renderWithProviders(
      <Switch
        value={false}
        onValueChange={onValueChange}
        accessibilityLabel="โหมดมืด"
      />,
    );

    await fireEvent(
      screen.getByRole('switch', { name: 'โหมดมืด' }),
      'valueChange',
      true,
    );
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});

describe('FormTextField + zod', () => {
  const schema = z.object({
    name: z.string().min(1, { error: 'validation:required' }),
    email: z.email({ error: 'validation:email' }),
  });

  function SignUpForm({ onSubmit }: { onSubmit: (values: unknown) => void }) {
    const { control, handleSubmit } = useForm({
      resolver: zodResolver(schema),
      defaultValues: { name: '', email: '' },
    });
    return (
      <>
        <FormTextField control={control} name="name" label="ชื่อ" />
        <FormTextField
          control={control}
          name="email"
          label="อีเมล"
          keyboardType="email-address"
        />
        <Button title="สมัคร" onPress={() => handleSubmit(onSubmit)()} />
      </>
    );
  }

  test('แสดงข้อความ error จาก key ของ i18n และส่งฟอร์มได้เมื่อแก้แล้ว', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    await renderWithProviders(<SignUpForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('อีเมล'), 'abc');
    await user.press(screen.getByRole('button', { name: 'สมัคร' }));

    // 'validation:email' -> ข้อความไทย, 'validation:required' แทน {{field}} ด้วย label
    expect(await screen.findByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeOnTheScreen();
    expect(screen.getByText('กรุณากรอกชื่อ')).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('ชื่อ'), 'สมชาย');
    await user.clear(screen.getByLabelText('อีเมล'));
    await user.type(screen.getByLabelText('อีเมล'), 'somchai@example.com');
    await user.press(screen.getByRole('button', { name: 'สมัคร' }));

    // handleSubmit ของ react-hook-form เป็น async
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      name: 'สมชาย',
      email: 'somchai@example.com',
    });
    expect(screen.queryByText('รูปแบบอีเมลไม่ถูกต้อง')).not.toBeOnTheScreen();
  });
});
