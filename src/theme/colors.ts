/**
 * Color tokens.
 *
 * กติกา (palm-ui-rubric):
 * - มี accent สีเดียว (primary) + สีสถานะ success / warning / danger / info เท่านั้น ที่เหลือเป็น neutral
 * - ข้อความทุกระดับ (รวม textSecondary / textTertiary) ต้อง contrast >= 4.5:1 กับ bg / surface / surfaceAlt
 * - textDisabled และ borderStrong ใช้กับ control ที่ disabled / เส้นขอบ input เท่านั้น (>= 3:1)
 *
 * ค่า contrast ด้านล่างคำนวณจริงแล้ว ถ้าเปลี่ยนสีให้คำนวณใหม่ อย่าเลือกด้วยตา
 */

export type ColorTokens = {
  /** พื้นหลังของหน้าจอ */
  background: string;
  /** พื้นของ card / sheet / input */
  surface: string;
  /** พื้นรอง เช่น chip, skeleton, segmented control */
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** เฉพาะข้อความของ control ที่ disabled */
  textDisabled: string;
  /** เส้นแบ่งตกแต่ง (divider) */
  border: string;
  /** เส้นขอบของ input / checkbox ที่ต้องมองเห็นเป็น control (>= 3:1) */
  borderStrong: string;

  primary: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;

  success: string;
  onSuccess: string;
  successSoft: string;
  onSuccessSoft: string;

  warning: string;
  onWarning: string;
  warningSoft: string;
  onWarningSoft: string;

  danger: string;
  onDanger: string;
  dangerSoft: string;
  onDangerSoft: string;

  info: string;
  onInfo: string;
  infoSoft: string;
  onInfoSoft: string;

  /** ฉากหลังของ modal / bottom sheet */
  backdrop: string;
  /** สีเงา */
  shadow: string;
  /** skeleton shimmer */
  skeleton: string;
  skeletonHighlight: string;
  transparent: string;
};

/**
 * Light theme
 * text 16.55-17.74:1, textSecondary 6.62-7.56:1, textTertiary 4.76-5.43:1
 * primary บน surface 6.03:1, onPrimary บน primary 6.03:1
 * warning บน surfaceAlt 5.26:1, textDisabled 3.31-3.78:1, borderStrong บน surface 3.78:1
 */
export const lightColors: ColorTokens = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F4',
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#5F6B7A',
  textDisabled: '#7A8494',
  border: '#DCE0E6',
  borderStrong: '#7A8494',

  primary: '#2456E0',
  onPrimary: '#FFFFFF',
  primarySoft: '#E8EEFD',
  onPrimarySoft: '#1B43B3',

  success: '#157A3B',
  onSuccess: '#FFFFFF',
  successSoft: '#E3F5EA',
  onSuccessSoft: '#0F5A2B',

  warning: '#A14A07',
  onWarning: '#FFFFFF',
  warningSoft: '#FDF1E1',
  onWarningSoft: '#8A3F06',

  danger: '#D02626',
  onDanger: '#FFFFFF',
  dangerSoft: '#FDE8E8',
  onDangerSoft: '#A11B1B',

  info: '#0B6BA8',
  onInfo: '#FFFFFF',
  infoSoft: '#E2F1FA',
  onInfoSoft: '#08507F',

  backdrop: 'rgba(17, 24, 39, 0.5)',
  shadow: '#0F172A',
  skeleton: '#E4E7EC',
  skeletonHighlight: '#F2F4F7',
  transparent: 'transparent',
};

/**
 * Dark theme
 * text 13.84-17.29:1, textSecondary 7.97-9.95:1, textTertiary 6.05-7.56:1
 * primary บน surface 6.64:1, onPrimary บน primary 7.01:1
 * สีสถานะใช้ตัวอักษรสีเข้ม (on*) เพราะสีสว่างกับตัวอักษรขาวไม่ผ่าน 4.5:1
 * textDisabled 3.36-3.81:1, borderStrong บน surface 3.81:1
 */
export const darkColors: ColorTokens = {
  background: '#0C1017',
  surface: '#151B24',
  surfaceAlt: '#1E2631',
  text: '#F2F4F7',
  textSecondary: '#B4BCC8',
  textTertiary: '#9AA4B2',
  textDisabled: '#6B7789',
  border: '#2A3441',
  borderStrong: '#6B7789',

  primary: '#7C9CFF',
  onPrimary: '#0A1330',
  primarySoft: '#1D2A4D',
  onPrimarySoft: '#B7C9FF',

  success: '#4ADE80',
  onSuccess: '#0C1017',
  successSoft: '#12301F',
  onSuccessSoft: '#86EFAC',

  warning: '#FBBF24',
  onWarning: '#0C1017',
  warningSoft: '#33260A',
  onWarningSoft: '#FCD34D',

  danger: '#F87171',
  onDanger: '#0C1017',
  dangerSoft: '#3A1616',
  onDangerSoft: '#FCA5A5',

  info: '#38BDF8',
  onInfo: '#0C1017',
  infoSoft: '#0B2A3B',
  onInfoSoft: '#7DD3FC',

  backdrop: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  skeleton: '#1E2631',
  skeletonHighlight: '#2A3441',
  transparent: 'transparent',
};

export type StatusColor = 'primary' | 'success' | 'warning' | 'danger' | 'info';
