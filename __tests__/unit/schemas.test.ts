import { zodResolver } from '@hookform/resolvers/zod';
import { renderHook } from '@testing-library/react-native';
import { z } from 'zod';

import { useFieldErrorMessage } from '@/components/ui/form/FormTextField';
import { i18n, initI18n } from '@/i18n';
import {
  acceptTerms,
  email,
  loginSchema,
  OTP_LENGTH,
  otp,
  password,
  PASSWORD_MIN_LENGTH,
  passwordsMatch,
  requiredSelect,
  requiredString,
  thaiMobile,
  thaiNationalId,
  USERNAME_MIN_LENGTH,
} from '@/utils/schemas';

/** ข้อความ error ตัวแรก (react-hook-form แสดงตัวแรกของแต่ละช่อง) */
function firstMessage(schema: z.ZodType, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

/** ข้อความตัวแรกของแต่ละ path */
function messagesByPath(schema: z.ZodType, value: unknown) {
  const result = schema.safeParse(value);
  const map: Record<string, string> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      map[issue.path.join('.')] ??= issue.message;
    }
  }
  return map;
}

describe('requiredString', () => {
  const schema = requiredString();

  it('ผ่านและตัดช่องว่างหัวท้าย', () => {
    expect(schema.parse('  somchai  ')).toBe('somchai');
  });

  it.each([
    ['ว่าง', ''],
    ['มีแต่ช่องว่าง', '   '],
    ['undefined', undefined],
    ['null', null],
    ['ไม่ใช่ string', 42],
  ])('%s = validation:required', (_label, value) => {
    expect(firstMessage(schema, value)).toBe('validation:required');
  });

  it('ว่างแล้วต่อ .min() ข้อความแรก (ที่ react-hook-form แสดง) ยังเป็น required', () => {
    const chained = schema.min(3, { error: 'validation:minLength' });
    expect(firstMessage(chained, '')).toBe('validation:required');
    expect(firstMessage(chained, 'ab')).toBe('validation:minLength');
  });

  it('ไม่ใช้ abort: ช่องว่างไม่ทำให้ refine ระดับ object (ที่มี when) ถูกข้าม', () => {
    const form = z
      .object({ name: requiredString(), code: z.string() })
      .refine(data => data.code === 'ok', {
        error: 'validation:otp',
        path: ['code'],
        when: () => true,
      });
    expect(messagesByPath(form, { name: '', code: 'bad' })).toEqual({
      name: 'validation:required',
      code: 'validation:otp',
    });
  });

  it('check ที่ต่อท้ายโดยไม่ใส่ error ไม่ได้ข้อความ required ผิด ๆ', () => {
    // error ระดับ schema ต้องใช้กับ invalid_type เท่านั้น
    const tooLong = firstMessage(schema.max(3), 'abcd');
    expect(tooLong).toBeDefined();
    expect(tooLong).not.toBe('validation:required');
    expect(firstMessage(password().max(10), '12345678901')).not.toBe(
      'validation:required',
    );
    expect(firstMessage(requiredSelect().max(2), 'abc')).not.toBe(
      'validation:requiredSelect',
    );
    expect(firstMessage(otp(4).max(3), '1234')).not.toBe('validation:otp');
  });
});

describe('requiredSelect', () => {
  it('ยังไม่เลือก = validation:requiredSelect', () => {
    const schema = requiredSelect();
    expect(schema.parse('cnx')).toBe('cnx');
    expect(firstMessage(schema, '')).toBe('validation:requiredSelect');
    expect(firstMessage(schema, null)).toBe('validation:requiredSelect');
    expect(firstMessage(schema, undefined)).toBe('validation:requiredSelect');
  });
});

describe('email', () => {
  const schema = email();

  it('ผ่านและตัดช่องว่าง', () => {
    expect(schema.parse(' user@example.com ')).toBe('user@example.com');
  });

  it('ว่าง = required, ผิดรูปแบบ = validation:email', () => {
    expect(firstMessage(schema, '')).toBe('validation:required');
    expect(firstMessage(schema, 'user@')).toBe('validation:email');
    expect(firstMessage(schema, 'not an email')).toBe('validation:email');
  });
});

describe('thaiMobile', () => {
  const schema = thaiMobile();

  it.each(['0812345678', '081-234-5678', '0912345678'])('%s ผ่าน', value => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it('ว่าง = required, ผิด = validation:phone', () => {
    expect(firstMessage(schema, '')).toBe('validation:required');
    expect(firstMessage(schema, '0212345678')).toBe('validation:phone');
    expect(firstMessage(schema, '08123')).toBe('validation:phone');
  });
});

describe('thaiNationalId', () => {
  const schema = thaiNationalId();

  it('ผ่าน checksum', () => {
    expect(schema.safeParse('1101700207030').success).toBe(true);
    expect(schema.safeParse('1-1017-00207-03-0').success).toBe(true);
  });

  it('ว่าง = required, checksum ผิด = validation:nationalId', () => {
    expect(firstMessage(schema, '')).toBe('validation:required');
    expect(firstMessage(schema, '1101700207031')).toBe('validation:nationalId');
    expect(firstMessage(schema, '123')).toBe('validation:nationalId');
  });
});

describe('password', () => {
  it('ค่าเริ่มต้นยาวอย่างน้อย 8 และไม่ตัดช่องว่าง', () => {
    const schema = password();
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(schema.parse('12345678')).toBe('12345678');
    expect(schema.parse(' 1234567 ')).toBe(' 1234567 ');
    expect(firstMessage(schema, '1234567')).toBe('validation:minLength');
    expect(firstMessage(schema, '')).toBe('validation:required');
    expect(firstMessage(schema, undefined)).toBe('validation:required');
  });

  it('กำหนดความยาวได้', () => {
    const schema = password(12);
    expect(firstMessage(schema, 'short')).toBe('validation:minLength');
    expect(schema.safeParse('123456789012').success).toBe(true);
  });

  it('min = 1 ตรวจแค่ว่ากรอกแล้ว', () => {
    const schema = password(1);
    expect(schema.safeParse('x').success).toBe(true);
    expect(firstMessage(schema, '')).toBe('validation:required');
  });
});

describe('passwordsMatch', () => {
  const schema = z
    .object({ password: password(), confirmPassword: requiredString() })
    .refine(...passwordsMatch());

  it('ตรงกันผ่าน', () => {
    expect(
      schema.safeParse({ password: 'secret123', confirmPassword: 'secret123' })
        .success,
    ).toBe(true);
  });

  it('ไม่ตรงกัน error ไปที่ช่อง confirmPassword', () => {
    expect(
      messagesByPath(schema, {
        password: 'secret123',
        confirmPassword: 'secret124',
      }),
    ).toEqual({ confirmPassword: 'validation:passwordMismatch' });
  });

  it('ช่องยืนยันว่าง แสดง required ก่อน mismatch', () => {
    expect(
      messagesByPath(schema, { password: 'secret123', confirmPassword: '' }),
    ).toEqual({ confirmPassword: 'validation:required' });
  });

  it('ใช้กับชื่อช่องอื่นได้', () => {
    const custom = z
      .object({ newPin: z.string(), repeatPin: z.string() })
      .refine(...passwordsMatch('newPin', 'repeatPin'));
    expect(
      messagesByPath(custom, { newPin: '1234', repeatPin: '4321' }),
    ).toEqual({ repeatPin: 'validation:passwordMismatch' });
  });

  describe('ฟอร์มที่มีช่องอื่นด้วย (สมัครสมาชิก)', () => {
    const signup = z
      .object({
        email: email(),
        password: password(),
        confirmPassword: requiredString(),
        acceptTerms: acceptTerms(),
      })
      .refine(...passwordsMatch());
    const valid = {
      email: 'user@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      acceptTerms: true,
    };

    it.each([
      ['อีเมลว่าง', { email: '' }, { email: 'validation:required' }],
      ['อีเมลผิดรูปแบบ', { email: 'bad' }, { email: 'validation:email' }],
      [
        'ยังไม่ติ๊กยอมรับเงื่อนไข',
        { acceptTerms: false },
        { acceptTerms: 'validation:acceptTerms' },
      ],
    ])(
      '%s: ยังแสดง mismatch ที่ช่องยืนยันพร้อมกัน',
      (_label, patch, expected) => {
        expect(
          messagesByPath(signup, {
            ...valid,
            confirmPassword: 'secret124',
            ...patch,
          }),
        ).toEqual({
          ...expected,
          confirmPassword: 'validation:passwordMismatch',
        });
      },
    );

    it('ช่องรหัสผ่านเองยังผิด: แสดง error ของช่องนั้นก่อน ไม่แสดง mismatch', () => {
      expect(
        messagesByPath(signup, {
          ...valid,
          password: 'short',
          confirmPassword: 'other',
        }),
      ).toEqual({ password: 'validation:minLength' });
    });

    it('ค่าไม่ใช่ object ไม่ throw', () => {
      expect(signup.safeParse(undefined).success).toBe(false);
      expect(signup.safeParse('x').success).toBe(false);
    });

    it('zodResolver ส่งทั้ง required และ mismatch ให้ react-hook-form ในรอบเดียว', async () => {
      const result = await zodResolver(signup)(
        { ...valid, email: '', confirmPassword: 'secret124' },
        undefined,
        { fields: {}, shouldUseNativeValidation: false },
      );
      expect(result.errors.email?.message).toBe('validation:required');
      expect(result.errors.confirmPassword?.message).toBe(
        'validation:passwordMismatch',
      );
    });
  });
});

describe('otp', () => {
  it.each([
    ['ไม่ครบ', '12345'],
    ['เกิน', '1234567'],
    ['มีตัวอักษร', '12a456'],
    ['ว่าง', ''],
    ['undefined', undefined],
  ])('%s = validation:otp', (_label, value) => {
    expect(firstMessage(otp(), value)).toBe('validation:otp');
  });

  it('ค่าเริ่มต้น 6 หลัก และกำหนดจำนวนหลักได้', () => {
    expect(OTP_LENGTH).toBe(6);
    expect(otp().parse('123456')).toBe('123456');
    expect(otp(4).safeParse('1234').success).toBe(true);
    expect(firstMessage(otp(4), '123456')).toBe('validation:otp');
  });
});

describe('acceptTerms', () => {
  it('ต้องเป็น true เท่านั้น', () => {
    expect(acceptTerms().parse(true)).toBe(true);
    expect(firstMessage(acceptTerms(), false)).toBe('validation:acceptTerms');
    expect(firstMessage(acceptTerms(), undefined)).toBe(
      'validation:acceptTerms',
    );
    expect(firstMessage(acceptTerms(), 'true')).toBe('validation:acceptTerms');
  });

  it('type: รับ boolean (defaultValues เป็น false ได้) ค่าที่ผ่านแล้วเป็น true', () => {
    // ตรวจตอน tsc: ถ้ากลับไปใช้ z.literal(true) บรรทัดแรกจะ compile ไม่ผ่าน
    const defaultValue: z.input<ReturnType<typeof acceptTerms>> = false;
    const parsed: z.output<ReturnType<typeof acceptTerms>> = true;
    // @ts-expect-error ค่าที่ผ่าน schema แล้วเป็น false ไม่ได้
    const notParsed: z.output<ReturnType<typeof acceptTerms>> = false;
    expect([defaultValue, parsed, notParsed]).toEqual([false, true, false]);
  });
});

describe('loginSchema', () => {
  it('ผ่านด้วย username ของ DummyJSON (ไม่ใช่อีเมล)', () => {
    expect(
      loginSchema.parse({ username: ' emilys ', password: 'emilyspass' }),
    ).toEqual({ username: 'emilys', password: 'emilyspass' });
  });

  it('ช่องว่าง = required ทั้งสองช่อง', () => {
    expect(messagesByPath(loginSchema, { username: '', password: '' })).toEqual(
      { username: 'validation:required', password: 'validation:required' },
    );
  });

  it(`username สั้นกว่า ${USERNAME_MIN_LENGTH} ตัวอักษร = validation:minLength`, () => {
    expect(USERNAME_MIN_LENGTH).toBe(3);
    expect(
      messagesByPath(loginSchema, { username: 'ab', password: 'x' }),
    ).toEqual({ username: 'validation:minLength' });
  });

  it('รหัสผ่านไม่บังคับความยาวตอน login', () => {
    expect(
      loginSchema.safeParse({ username: 'emilys', password: 'x' }).success,
    ).toBe(true);
  });

  it('zodResolver ส่งข้อความ (i18n key) ต่อให้ react-hook-form ตรง ๆ', async () => {
    const result = await zodResolver(loginSchema)(
      { username: '', password: '' },
      undefined,
      { fields: {}, shouldUseNativeValidation: false },
    );
    expect(result.errors.username?.message).toBe('validation:required');
    expect(result.errors.password?.message).toBe('validation:required');
  });
});

describe('ใช้ร่วมกับ form wrapper (useFieldErrorMessage)', () => {
  /** ทุกข้อความที่ schema ในไฟล์นี้ส่งออกได้ */
  const allMessages = [
    firstMessage(requiredString(), ''),
    firstMessage(requiredSelect(), ''),
    firstMessage(email(), 'bad'),
    firstMessage(thaiMobile(), '0212345678'),
    firstMessage(thaiNationalId(), '1101700207031'),
    firstMessage(password(), 'short'),
    firstMessage(otp(), ''),
    firstMessage(acceptTerms(), false),
    messagesByPath(
      z
        .object({ password: z.string(), confirmPassword: z.string() })
        .refine(...passwordsMatch()),
      { password: 'a', confirmPassword: 'b' },
    ).confirmPassword,
    ...Object.values(
      messagesByPath(loginSchema, { username: 'ab', password: '' }),
    ),
  ];

  beforeAll(() => {
    initI18n('th');
  });

  it('ทุกข้อความเป็น i18n key ที่มีอยู่จริง', () => {
    expect(allMessages).toHaveLength(11);
    for (const message of allMessages) {
      expect({ message, exists: i18n.exists(message!) }).toEqual({
        message,
        exists: true,
      });
    }
  });

  it('wrapper แปลเป็นภาษาไทยและเติม field / count ครบ', async () => {
    const { result } = await renderHook(() => useFieldErrorMessage());
    const values = { field: 'ชื่อผู้ใช้', count: USERNAME_MIN_LENGTH };

    expect(result.current('validation:required', values)).toBe(
      'กรุณากรอกชื่อผู้ใช้',
    );
    expect(result.current('validation:minLength', values)).toBe(
      'ต้องมีอย่างน้อย 3 ตัวอักษร',
    );
    expect(result.current('validation:otp', { count: OTP_LENGTH })).toBe(
      'กรุณากรอกรหัส OTP ให้ครบ 6 หลัก',
    );

    for (const message of allMessages) {
      const text = result.current(message, values);
      // ต้องไม่เหลือ key หรือ {{ }} ค้างบนจอ
      expect({ message, text }).toEqual({
        message,
        text: expect.not.stringMatching(/validation:|\{\{|\}\}/),
      });
      expect(text).toMatch(/[ก-๙]/);
    }
  });

  it('ภาษาอังกฤษ', async () => {
    await i18n.changeLanguage('en');
    const { result, unmount } = await renderHook(() => useFieldErrorMessage());
    try {
      expect(
        result.current('validation:minLength', { count: PASSWORD_MIN_LENGTH }),
      ).toBe('Must be at least 8 characters');
      expect(result.current('validation:passwordMismatch')).toBe(
        'Passwords do not match',
      );
    } finally {
      // unmount ก่อนเปลี่ยนภาษากลับ ไม่ให้ hook re-render นอก act()
      await unmount();
      await i18n.changeLanguage('th');
    }
  });
});
