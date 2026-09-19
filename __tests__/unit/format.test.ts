import dayjs from '@/utils/date';
import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelative,
  formatThaiNationalId,
  formatThaiPhone,
  getInitials,
  maskPhone,
} from '@/utils/format';

// ภาษาของ dayjs เป็นค่ากลางของทั้งโปรเซส: ตั้งเองในแต่ละ test แล้วคืนค่าเดิม
const originalLocale = dayjs.locale();

afterEach(() => {
  dayjs.locale(originalLocale);
  jest.useRealTimers();
});

describe('formatNumber', () => {
  it('ใส่ comma และทศนิยม 2 ตำแหน่งเป็นค่าเริ่มต้น', () => {
    expect(formatNumber(1234.5)).toBe('1,234.50');
    expect(formatNumber(1234567.891)).toBe('1,234,567.89');
    expect(formatNumber(0)).toBe('0.00');
    expect(formatNumber(-42)).toBe('-42.00');
  });

  it('กำหนดจำนวนทศนิยมได้', () => {
    expect(formatNumber(1234.5, { decimals: 0 })).toBe('1,235');
    expect(formatNumber(1.23456, { decimals: 3 })).toBe('1.235');
  });

  it('รับ string ที่เป็นตัวเลขได้', () => {
    expect(formatNumber('1000')).toBe('1,000.00');
  });

  it('ค่าว่าง / ไม่ใช่ตัวเลข คืน fallback', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatNumber(undefined)).toBe('-');
    expect(formatNumber('')).toBe('-');
    expect(formatNumber('abc')).toBe('-');
    expect(formatNumber(Number.NaN)).toBe('-');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('-');
    expect(formatNumber(null, { fallback: 'N/A' })).toBe('N/A');
  });
});

describe('formatCurrency', () => {
  it('ใช้สัญลักษณ์ ฿ นำหน้าเป็นค่าเริ่มต้น', () => {
    expect(formatCurrency(1234.5)).toBe('฿1,234.50');
    expect(formatCurrency(0)).toBe('฿0.00');
  });

  it('ค่าติดลบ ใส่เครื่องหมายไว้หน้าสัญลักษณ์', () => {
    expect(formatCurrency(-1234.5)).toBe('-฿1,234.50');
    expect(formatCurrency(-99, { style: 'suffix' })).toBe('-99.00 บาท');
  });

  it('แบบ suffix ต่อท้ายด้วยหน่วย', () => {
    expect(formatCurrency(1234.5, { style: 'suffix' })).toBe('1,234.50 บาท');
    expect(formatCurrency(10, { style: 'suffix', suffix: 'THB' })).toBe(
      '10.00 THB',
    );
    expect(formatCurrency(1500, { decimals: 0 })).toBe('฿1,500');
  });

  it('ค่าว่าง คืน fallback', () => {
    expect(formatCurrency(null)).toBe('-');
    expect(formatCurrency('x', { fallback: '' })).toBe('');
  });
});

describe('formatPercent', () => {
  it('คูณ 100 และทศนิยม 1 ตำแหน่ง', () => {
    expect(formatPercent(0.125)).toBe('12.5%');
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatPercent(0.12345, 2)).toBe('12.35%');
  });

  it('ค่าว่าง คืน -', () => {
    expect(formatPercent(null)).toBe('-');
    expect(formatPercent('abc')).toBe('-');
  });
});

describe('formatBytes', () => {
  it('แปลงหน่วยฐาน 1024', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 ** 2 * 3.25, 2)).toBe('3.25 MB');
    expect(formatBytes(1024 ** 3)).toBe('1.0 GB');
  });

  it('ใหญ่กว่า TB ยังแสดงเป็น TB', () => {
    expect(formatBytes(1024 ** 5)).toBe('1024.0 TB');
  });

  it('ค่า 0 / ติดลบ / ไม่ใช่ตัวเลข คืน 0 B', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});

describe('formatThaiPhone', () => {
  it('มือถือ 10 หลัก -> 081-234-5678', () => {
    expect(formatThaiPhone('0812345678')).toBe('081-234-5678');
    expect(formatThaiPhone('081 234 5678')).toBe('081-234-5678');
  });

  it('เบอร์บ้าน 9 หลัก -> 02-123-4567', () => {
    expect(formatThaiPhone('021234567')).toBe('02-123-4567');
  });

  it('ความยาวอื่นคืนค่าเดิม', () => {
    expect(formatThaiPhone('12345')).toBe('12345');
    expect(formatThaiPhone('+66812345678')).toBe('+66812345678');
    expect(formatThaiPhone(null)).toBe('');
    expect(formatThaiPhone(undefined)).toBe('');
  });
});

describe('formatThaiNationalId', () => {
  it('13 หลัก -> 1-1017-00207-03-0', () => {
    expect(formatThaiNationalId('1101700207030')).toBe('1-1017-00207-03-0');
    expect(formatThaiNationalId('1-1017-00207-03-0')).toBe('1-1017-00207-03-0');
  });

  it('ความยาวอื่นคืนค่าเดิม', () => {
    expect(formatThaiNationalId('123')).toBe('123');
    expect(formatThaiNationalId(null)).toBe('');
  });
});

describe('maskPhone', () => {
  it('ซ่อน 3 หลักกลาง', () => {
    expect(maskPhone('0812345678')).toBe('081-xxx-5678');
    expect(maskPhone('081-234-5678')).toBe('081-xxx-5678');
  });

  it('ไม่ใช่ 10 หลักคืนค่าเดิม', () => {
    expect(maskPhone('021234567')).toBe('021234567');
    expect(maskPhone(undefined)).toBe('');
  });
});

describe('getInitials', () => {
  it('ตัวแรกของชื่อและนามสกุล', () => {
    expect(getInitials('somchai jaidee')).toBe('SJ');
    expect(getInitials('  Emily   Johnson  ')).toBe('EJ');
    expect(getInitials('สมชาย มั่นคง')).toBe('สม');
  });

  // กันถอยหลัง: สระหน้า (เ แ โ ใ ไ) ไม่ใช่ตัวอักษรแรกของชื่อ (เคยได้ 'ใจดี' -> 'ใ')
  it('ชื่อไทยที่ขึ้นต้นด้วยสระหน้า ใช้พยัญชนะตัวแรก', () => {
    expect(getInitials('สมชาย ใจดี')).toBe('สจ');
    expect(getInitials('เอก แสงทอง')).toBe('อส');
    expect(getInitials('ไพโรจน์')).toBe('พ');
  });

  it('จำกัดจำนวนตัวอักษรด้วย max', () => {
    expect(getInitials('Anna Maria Garcia')).toBe('AM');
    expect(getInitials('Anna Maria Garcia', 3)).toBe('AMG');
    expect(getInitials('Anna Maria Garcia', 1)).toBe('A');
  });

  it('ค่าว่างคืนสตริงว่าง', () => {
    expect(getInitials('')).toBe('');
    expect(getInitials('   ')).toBe('');
    expect(getInitials(null)).toBe('');
  });
});

describe('formatDate', () => {
  // ใช้เวลาท้องถิ่น (ไม่มี Z) ผลลัพธ์จึงไม่ขึ้นกับ timezone ของเครื่องที่รัน test
  const value = '2026-09-19T14:30:00';

  it('ภาษาไทยใช้ปี พ.ศ.', () => {
    dayjs.locale('th');
    expect(formatDate('2026-09-19')).toBe('19 ก.ย. 2569');
    expect(formatDate(value, 'dateLong')).toBe('19 กันยายน 2569');
    expect(formatDate(value, 'dateTime')).toBe('19 ก.ย. 2569 14:30');
    expect(formatDate(value, 'time')).toBe('14:30');
    expect(formatDate(value, 'numeric')).toBe('19/09/2569');
  });

  it('ภาษาอังกฤษใช้ปี ค.ศ.', () => {
    dayjs.locale('en');
    expect(formatDate('2026-09-19')).toBe('Sep 19, 2026');
    expect(formatDate(value, 'dateLong')).toBe('September 19, 2026');
    expect(formatDate(value, 'dateTime')).toBe('Sep 19, 2026 14:30');
    expect(formatDate(value, 'numeric')).toBe('19/09/2026');
  });

  it('รับ Date และ timestamp ได้', () => {
    dayjs.locale('th');
    const date = new Date(2026, 8, 19, 9, 5);
    expect(formatDate(date, 'dateTime')).toBe('19 ก.ย. 2569 09:05');
    expect(formatDate(date.getTime(), 'date')).toBe('19 ก.ย. 2569');
  });

  it('ค่าว่าง / วันที่ผิด คืน fallback', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('')).toBe('-');
    expect(formatDate('not-a-date')).toBe('-');
    expect(formatDate(null, 'date', '')).toBe('');
  });
});

describe('formatRelative', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 19, 12, 0, 0) });
  });

  it('ภาษาไทย', () => {
    dayjs.locale('th');
    expect(formatRelative(new Date(2026, 8, 19, 11, 57))).toBe('3 นาทีที่แล้ว');
    expect(formatRelative(new Date(2026, 8, 17, 12, 0))).toBe('2 วันที่แล้ว');
  });

  it('ภาษาอังกฤษ', () => {
    dayjs.locale('en');
    expect(formatRelative(new Date(2026, 8, 19, 11, 57))).toBe('3 minutes ago');
    expect(formatRelative(new Date(2026, 8, 19, 15, 0))).toBe('in 3 hours');
  });

  it('ค่าว่าง / วันที่ผิด คืน fallback', () => {
    expect(formatRelative(null)).toBe('-');
    expect(formatRelative('')).toBe('-');
    expect(formatRelative('not-a-date', 'ไม่ทราบ')).toBe('ไม่ทราบ');
  });
});
