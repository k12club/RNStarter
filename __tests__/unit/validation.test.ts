import {
  isValidBankAccount,
  isValidEmail,
  isValidThaiMobile,
  isValidThaiNationalId,
  onlyDigits,
} from '@/utils/validation';

/** คำนวณหลักตรวจสอบตามสูตรของกรมการปกครอง (แยกจากโค้ดที่ทดสอบ) */
function checkDigit(first12: string): number {
  const sum = first12
    .split('')
    .reduce((acc, digit, i) => acc + Number(digit) * (13 - i), 0);
  return (11 - (sum % 11)) % 10;
}

function withCheckDigit(first12: string): string {
  return `${first12}${checkDigit(first12)}`;
}

describe('isValidThaiNationalId', () => {
  it('เลขตัวอย่าง 1101700207030 ผ่าน checksum จริง', () => {
    // 1*13 + 1*12 + 0*11 + 1*10 + 7*9 + 0*8 + 0*7 + 2*6 + 0*5 + 7*4 + 0*3 + 3*2 = 144
    // 144 % 11 = 1 -> (11 - 1) % 10 = 0 = หลักสุดท้าย
    expect(checkDigit('110170020703')).toBe(0);
    expect(isValidThaiNationalId('1101700207030')).toBe(true);
  });

  it.each(['310010012345', '123456789012', '500000000000', '899999999999'])(
    'เลขที่สร้างจากสูตร %s + check digit ผ่าน',
    first12 => {
      expect(isValidThaiNationalId(withCheckDigit(first12))).toBe(true);
    },
  );

  it('sum % 11 = 0 ได้ check digit = 1 (กรณีขอบของ modulo)', () => {
    // หาเลข 12 หลักที่ผลรวมถ่วงน้ำหนักหาร 11 ลงตัว
    const candidate = Array.from({ length: 200 }, (_, n) =>
      String(100000000000 + n),
    ).find(
      s =>
        s.split('').reduce((acc, d, i) => acc + Number(d) * (13 - i), 0) %
          11 ===
        0,
    );
    expect(candidate).toBeDefined();
    expect(checkDigit(candidate!)).toBe(1);
    expect(isValidThaiNationalId(`${candidate}1`)).toBe(true);
    expect(isValidThaiNationalId(`${candidate}0`)).toBe(false);
  });

  it('รับเลขที่มีขีด / ช่องว่าง', () => {
    expect(isValidThaiNationalId('1-1017-00207-03-0')).toBe(true);
    expect(isValidThaiNationalId('1 1017 00207 03 0')).toBe(true);
  });

  it('check digit ผิดไม่ผ่าน', () => {
    for (let wrong = 1; wrong <= 9; wrong++) {
      expect(isValidThaiNationalId(`110170020703${wrong}`)).toBe(false);
    }
  });

  it('ความยาวไม่ใช่ 13 หลักไม่ผ่าน', () => {
    expect(isValidThaiNationalId('')).toBe(false);
    expect(isValidThaiNationalId('110170020703')).toBe(false);
    expect(isValidThaiNationalId('11017002070300')).toBe(false);
    expect(isValidThaiNationalId('abcdefghijklm')).toBe(false);
  });
});

describe('isValidThaiMobile', () => {
  it.each([
    '0812345678',
    '0612345678',
    '0912345678',
    '081-234-5678',
    '081 234 5678',
  ])('%s ผ่าน', value => {
    expect(isValidThaiMobile(value)).toBe(true);
  });

  it.each([
    ['เบอร์บ้าน', '0212345678'],
    ['ขึ้นต้น 07', '0712345678'],
    ['9 หลัก', '081234567'],
    ['11 หลัก', '08123456789'],
    ['รูปแบบ +66', '+66812345678'],
    ['ว่าง', ''],
  ])('%s (%s) ไม่ผ่าน', (_label, value) => {
    expect(isValidThaiMobile(value)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it.each(['a@b.co', 'user.name+tag@example.com', '  user@example.co.th  '])(
    '%s ผ่าน',
    value => {
      expect(isValidEmail(value)).toBe(true);
    },
  );

  it.each([
    '',
    'plainaddress',
    'a@b',
    'a@b.c',
    'a b@c.com',
    '@example.com',
    'a@@b.com',
  ])('"%s" ไม่ผ่าน', value => {
    expect(isValidEmail(value)).toBe(false);
  });
});

describe('isValidBankAccount', () => {
  it.each(['1234567890', '12345678901', '123456789012', '123-4-56789-0'])(
    '%s ผ่าน (10-12 หลัก)',
    value => {
      expect(isValidBankAccount(value)).toBe(true);
    },
  );

  it.each(['', '123456789', '1234567890123'])('"%s" ไม่ผ่าน', value => {
    expect(isValidBankAccount(value)).toBe(false);
  });
});

describe('onlyDigits', () => {
  it('ตัดทุกอย่างที่ไม่ใช่ตัวเลข', () => {
    expect(onlyDigits('081-234-5678')).toBe('0812345678');
    expect(onlyDigits('+66 (81) 234 5678')).toBe('66812345678');
    expect(onlyDigits('abc')).toBe('');
  });
});
