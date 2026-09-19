import { useMemo } from 'react';
import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

/**
 * Responsive helpers
 *
 * - wp / hp: เปอร์เซ็นต์ของความกว้าง / สูงหน้าจอ (จาก react-native-responsive-screen)
 *   ใช้กับขนาดของ layout เช่น ความกว้างรูป, ความสูง banner
 * - scale / verticalScale / moderateScale: ขยายตามขนาดจอเทียบกับจอออกแบบ 375x812
 *   ใช้กับ spacing / ขนาด icon ที่อยากให้โตตามจอเล็กน้อย
 *
 * ห้ามใช้กับขนาดตัวอักษร: ตัวอักษรใช้ typeScale ใน typography.ts
 * (dp คงที่ + Dynamic Type ของระบบ) เพื่อไม่ให้ข้อความไทยเล็กกว่า 14 บนจอเล็ก
 *
 * ข้อจำกัดของ react-native-responsive-screen (ไม่อัปเดตตั้งแต่ปี 2020):
 * - wp / hp จำขนาดจอตอนโหลดโมดูล ไม่เปลี่ยนเมื่อหมุนจอ / split-screen / จอพับ
 *   หน้าที่ต้องรองรับการหมุนจอให้ใช้ useResponsive() ด้านล่างแทน
 * - ห้ามใช้ listenOrientationChange / removeOrientationListener (พังบน RN 0.87)
 * ทุกที่ให้ import wp / hp จากไฟล์นี้ ถ้าวันหนึ่งต้องเปลี่ยน library จะแก้ที่เดียว
 */

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

export const wp = (percent: number | string) => widthPercentageToDP(percent);
export const hp = (percent: number | string) => heightPercentageToDP(percent);

function toPercent(value: number | string) {
  return typeof value === 'number' ? value : parseFloat(value);
}

/** wp / hp ที่คำนวณจากขนาดหน้าต่างปัจจุบัน และ re-render เมื่อหมุนจอ */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return useMemo(
    () => ({
      width,
      height,
      isLandscape: width > height,
      isTablet: Math.min(width, height) >= 600,
      wp: (percent: number | string) =>
        PixelRatio.roundToNearestPixel((width * toPercent(percent)) / 100),
      hp: (percent: number | string) =>
        PixelRatio.roundToNearestPixel((height * toPercent(percent)) / 100),
    }),
    [width, height],
  );
}

function shortSide() {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height);
}

function longSide() {
  const { width, height } = Dimensions.get('window');
  return Math.max(width, height);
}

/** ขยายตามความกว้าง (ด้านสั้นของจอ) */
export function scale(size: number) {
  return PixelRatio.roundToNearestPixel((shortSide() / DESIGN_WIDTH) * size);
}

/** ขยายตามความสูง (ด้านยาวของจอ) */
export function verticalScale(size: number) {
  return PixelRatio.roundToNearestPixel((longSide() / DESIGN_HEIGHT) * size);
}

/**
 * ขยายแบบนุ่มนวล: factor 0 = ไม่ขยาย, 1 = เท่ากับ scale()
 * ค่าเริ่มต้น 0.5 เหมาะกับ padding / icon
 */
export function moderateScale(size: number, factor = 0.5) {
  return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
}

/** true เมื่อด้านสั้นของจอ >= 600dp (แท็บเล็ต) */
export function isTablet() {
  return shortSide() >= 600;
}
