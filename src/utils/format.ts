import dayjs from '@/utils/date';

/**
 * ฟังก์ชัน format สำหรับแสดงผล (ไม่ใช้กับข้อมูลที่ส่ง API)
 * ใช้ Intl ของ Hermes (รองรับทั้ง iOS และ Android)
 */

type NumberInput = number | string | null | undefined;

function toNumber(value: NumberInput): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** 1234.5 -> "1,234.50" */
export function formatNumber(
  value: NumberInput,
  options: { decimals?: number; fallback?: string } = {},
): string {
  const { decimals = 2, fallback = '-' } = options;
  const n = toNumber(value);
  if (n === null) {
    return fallback;
  }
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 1234.5 -> "฿1,234.50" หรือ "1,234.50 บาท" เมื่อ style = 'suffix' */
export function formatCurrency(
  value: NumberInput,
  options: {
    decimals?: number;
    style?: 'symbol' | 'suffix';
    suffix?: string;
    fallback?: string;
  } = {},
): string {
  const {
    decimals = 2,
    style = 'symbol',
    suffix = 'บาท',
    fallback = '-',
  } = options;
  const n = toNumber(value);
  if (n === null) {
    return fallback;
  }
  const formatted = formatNumber(Math.abs(n), { decimals });
  const sign = n < 0 ? '-' : '';
  return style === 'symbol'
    ? `${sign}฿${formatted}`
    : `${sign}${formatted} ${suffix}`;
}

/** 0.125 -> "12.5%" */
export function formatPercent(value: NumberInput, decimals = 1): string {
  const n = toNumber(value);
  if (n === null) {
    return '-';
  }
  return `${formatNumber(n * 100, { decimals })}%`;
}

/** 1536 -> "1.5 KB" */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

type DateInput = string | number | Date | null | undefined;

/**
 * format วันที่ตามภาษาปัจจุบันของ dayjs (ตั้งใน i18n)
 * ภาษาไทยใช้ปี พ.ศ. ผ่าน token BBBB
 *
 * ค่า preset:
 * - date      19 ก.ย. 2569 / Sep 19, 2026
 * - dateLong  19 กันยายน 2569 / September 19, 2026
 * - dateTime  19 ก.ย. 2569 14:30 / Sep 19, 2026 14:30
 * - time      14:30
 */
const DATE_PRESETS = {
  th: {
    date: 'D MMM BBBB',
    dateLong: 'D MMMM BBBB',
    dateTime: 'D MMM BBBB HH:mm',
    time: 'HH:mm',
    numeric: 'DD/MM/BBBB',
  },
  en: {
    date: 'MMM D, YYYY',
    dateLong: 'MMMM D, YYYY',
    dateTime: 'MMM D, YYYY HH:mm',
    time: 'HH:mm',
    numeric: 'DD/MM/YYYY',
  },
} as const;

export type DatePreset = keyof (typeof DATE_PRESETS)['th'];

export function formatDate(
  value: DateInput,
  preset: DatePreset = 'date',
  fallback = '-',
): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const d = dayjs(value);
  if (!d.isValid()) {
    return fallback;
  }
  const lang = dayjs.locale() === 'th' ? 'th' : 'en';
  return d.format(DATE_PRESETS[lang][preset]);
}

/** "3 นาทีที่แล้ว" / "3 minutes ago" */
export function formatRelative(value: DateInput, fallback = '-'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const d = dayjs(value);
  return d.isValid() ? d.fromNow() : fallback;
}

/** "0812345678" -> "081-234-5678" (เบอร์มือถือไทย 10 หลัก) */
export function formatThaiPhone(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return value ?? '';
}

/** "1101700207030" -> "1-1017-00207-03-0" */
export function formatThaiNationalId(value: string | null | undefined): string {
  const d = (value ?? '').replace(/\D/g, '');
  if (d.length !== 13) {
    return value ?? '';
  }
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${
    d[12]
  }`;
}

/** ซ่อนข้อมูลบางส่วน: "0812345678" -> "081-xxx-5678" */
export function maskPhone(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length !== 10) {
    return value ?? '';
  }
  return `${digits.slice(0, 3)}-xxx-${digits.slice(6)}`;
}

// สระหน้า เ แ โ ใ ไ (U+0E40-U+0E44) เขียนก่อนพยัญชนะ แต่ไม่ใช่ตัวอักษรแรกของชื่อ
const THAI_LEADING_VOWEL = /^[\u0E40-\u0E44]$/;

/** ตัวอักษรแรกของชื่อ-นามสกุล สำหรับ Avatar ('สมชาย ใจดี' -> 'สจ') */
export function getInitials(name: string | null | undefined, max = 2): string {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map(part => {
      const chars = Array.from(part);
      const first = chars.find(char => !THAI_LEADING_VOWEL.test(char));
      return (first ?? chars[0] ?? '').toUpperCase();
    })
    .join('');
}
