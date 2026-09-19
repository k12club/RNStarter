import { z } from 'zod';

import { isValidThaiMobile, isValidThaiNationalId } from '@/utils/validation';

/**
 * schema กลางของฟอร์ม (zod v4) ใช้กับ react-hook-form ผ่าน zodResolver
 *
 * ข้อความ error เป็น i18n key ล้วน เช่น 'validation:minLength' (ไม่มีตัวแปรในข้อความ)
 * form wrapper (components/ui/form) แปลให้ และเติมตัวแปรเอง:
 * - {{field}} = label ของช่อง (ใส่ให้อัตโนมัติ)
 * - {{count}} ของ 'validation:otp' = length ของ FormOTPInput (ใส่ให้อัตโนมัติ)
 * - {{count}} ของ 'validation:minLength' ต้องส่งเองผ่าน errorValues เช่น
 *   <FormTextField name="password" label={...} errorValues={{ count: PASSWORD_MIN_LENGTH }} />
 *
 * ทุก schema กำหนด error ของ type เองด้วย ไม่ให้ข้อความ default ของ zod หลุดไปถึงผู้ใช้
 *
 * ห้ามใส่ abort: true ใน check ของช่อง: zod 4.6 จะข้าม refine ระดับ object ทุกตัว
 * (รวมตัวที่มี when เช่น passwordsMatch) ตราบที่ช่องนั้นยังผิด
 * ช่องว่างจึงอาจได้ error หลายตัว แต่ react-hook-form แสดงแค่ตัวแรก ('validation:required')
 */

export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 3;
export const OTP_LENGTH = 6;

/**
 * error ระดับ schema ที่ใช้เฉพาะตอนค่าผิด type (undefined / null / ไม่ใช่ string)
 * ถ้าใส่เป็น string ตรง ๆ zod 4.6 จะเอาไปใช้กับ check ที่ต่อท้ายแต่ไม่ได้ใส่ error เองด้วย
 * เช่น requiredString().max(50) จะขึ้นว่า 'กรุณากรอก...' ตอนพิมพ์ยาวเกิน
 */
function typeError(key: string) {
  return (issue: z.core.$ZodRawIssue) =>
    issue.code === 'invalid_type' ? key : undefined;
}

/**
 * ข้อความที่ต้องกรอก (ตัดช่องว่างหัวท้าย) ต่อ .min() / .max() ได้
 * ใส่ error เป็น key เองทุกครั้ง เช่น .max(50, { error: 'validation:maxLength' })
 */
export function requiredString() {
  return z
    .string({ error: typeError('validation:required') })
    .trim()
    .min(1, { error: 'validation:required' });
}

/** ค่าที่ต้องเลือก (Select / RadioGroup ที่ค่าเป็น string) */
export function requiredSelect() {
  return z
    .string({ error: typeError('validation:requiredSelect') })
    .min(1, { error: 'validation:requiredSelect' });
}

/** อีเมล: ว่าง = ต้องกรอก, ผิดรูปแบบ = validation:email */
export function email() {
  return requiredString().pipe(z.email({ error: 'validation:email' }));
}

/** เบอร์มือถือไทย 10 หลัก (รับขีด / ช่องว่างได้ ค่าที่ได้ยังไม่ตัดขีด ใช้ onlyDigits ก่อนส่ง API) */
export function thaiMobile() {
  return requiredString().refine(isValidThaiMobile, {
    error: 'validation:phone',
  });
}

/** เลขบัตรประชาชน 13 หลัก ตรวจ checksum */
export function thaiNationalId() {
  return requiredString().refine(isValidThaiNationalId, {
    error: 'validation:nationalId',
  });
}

/**
 * รหัสผ่านสำหรับตั้งใหม่ / สมัครสมาชิก (ไม่ตัดช่องว่าง)
 * ช่องที่ใช้ต้องส่ง errorValues={{ count: min }} ให้ข้อความ minLength
 */
export function password(min = PASSWORD_MIN_LENGTH) {
  const base = z
    .string({ error: typeError('validation:required') })
    .min(1, { error: 'validation:required' });
  return min > 1 ? base.min(min, { error: 'validation:minLength' }) : base;
}

/**
 * ตรวจว่ารหัสผ่านสองช่องตรงกัน error ไปแสดงที่ช่องยืนยัน
 * ใช้: z.object({ password: password(), confirmPassword: requiredString() })
 *        .refine(...passwordsMatch())
 *
 * ปกติ zod ข้าม refine ของ object เมื่อช่องใดก็ตามผิด (เช่น ยังไม่ติ๊กยอมรับเงื่อนไข)
 * จึงใส่ when ให้ตรวจเมื่อสองช่องนี้ผ่านแล้ว ไม่สนช่องอื่น
 */
export function passwordsMatch<
  P extends string = 'password',
  C extends string = 'confirmPassword',
>(
  passwordKey: P = 'password' as P,
  confirmKey: C = 'confirmPassword' as C,
): [
  check: (data: Record<P | C, unknown>) => boolean,
  params: {
    error: string;
    path: string[];
    when: (payload: z.core.ParsePayload) => boolean;
  },
] {
  return [
    data => data[passwordKey] === data[confirmKey],
    {
      error: 'validation:passwordMismatch',
      path: [confirmKey],
      when: ({ value, issues, aborted }) => {
        if (aborted || typeof value !== 'object' || value === null) {
          return false;
        }
        // ไม่ตรวจถ้าสองช่องนี้ (หรือตัว object) ยังผิดอยู่: ให้เห็น error ของช่องนั้นก่อน
        return !issues.some(issue => {
          const key = issue.path?.[0];
          return key === undefined || key === passwordKey || key === confirmKey;
        });
      },
    },
  ];
}

/** รหัส OTP ตัวเลขครบตามจำนวนหลัก (ว่างก็ใช้ข้อความเดียวกัน) */
export function otp(length = OTP_LENGTH) {
  return z
    .string({ error: typeError('validation:otp') })
    .trim()
    .regex(new RegExp(`^\\d{${length}}$`), { error: 'validation:otp' });
}

/**
 * checkbox ยอมรับเงื่อนไข ต้องติ๊กเท่านั้น
 * รับค่าเป็น boolean (defaultValues ใส่ false ได้) แต่ค่าที่ผ่านแล้วเป็น true เสมอ
 * ถ้าใช้ z.literal(true) ตรง ๆ useForm จะ type error เมื่อตั้ง defaultValues เป็น false
 */
export function acceptTerms() {
  return z
    .boolean({ error: typeError('validation:acceptTerms') })
    .pipe(z.literal(true, { error: 'validation:acceptTerms' }));
}

/**
 * ฟอร์ม login ของ demo (DummyJSON ใช้ username ไม่ใช่อีเมล)
 * - ช่อง username ต้องส่ง errorValues={{ count: USERNAME_MIN_LENGTH }}
 * - รหัสผ่านตรวจแค่ว่ากรอกแล้ว: บัญชีเดิมอาจตั้งรหัสไว้ก่อนมีกติกาความยาว
 */
export const loginSchema = z.object({
  username: requiredString().min(USERNAME_MIN_LENGTH, {
    error: 'validation:minLength',
  }),
  password: password(1),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
