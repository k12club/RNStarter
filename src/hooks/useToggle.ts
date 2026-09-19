import { useCallback, useState } from 'react';

/** state boolean พร้อม toggle / setTrue / setFalse ที่ reference คงที่ */
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, setValue, toggle, setTrue, setFalse } as const;
}
