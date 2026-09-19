import { useEffect, useRef } from 'react';

/** ค่าจาก render ก่อนหน้า (render แรกคืน undefined) */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
