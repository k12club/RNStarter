import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

/**
 * refetch เมื่อกลับมาที่หน้าจอนี้ (ไม่ทำตอนเข้าหน้าครั้งแรก เพราะ useQuery fetch ให้อยู่แล้ว)
 *
 * @example
 * const { refetch } = useQuery(...);
 * useRefreshOnFocus(refetch);
 */
export function useRefreshOnFocus(refetch: () => unknown) {
  const firstTime = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTime.current) {
        firstTime.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
