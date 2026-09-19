import { useEffect, useState } from 'react';

/** คืนค่าที่อัปเดตหลังจาก value หยุดเปลี่ยนไป delay ms (เช่น ช่องค้นหา) */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
