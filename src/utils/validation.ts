/**
 * ตัวตรวจข้อมูลที่ใช้บ่อยในแอปไทย
 * ใช้ร่วมกับ zod ผ่าน .refine() ได้ ดู src/utils/schemas.ts
 */

/** ตรวจเลขบัตรประชาชนไทย 13 หลัก ด้วย checksum หลักสุดท้าย */
export function isValidThaiNationalId(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (!/^\d{13}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const check = (11 - (sum % 11)) % 10;
  return check === Number(digits[12]);
}

/** เบอร์มือถือไทย 10 หลัก ขึ้นต้นด้วย 06 / 08 / 09 */
export function isValidThaiMobile(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^0[689]\d{8}$/.test(digits);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** เลขบัญชีธนาคารไทยส่วนใหญ่ยาว 10-12 หลัก */
export function isValidBankAccount(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return /^\d{10,12}$/.test(digits);
}

/** เก็บเฉพาะตัวเลข */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
