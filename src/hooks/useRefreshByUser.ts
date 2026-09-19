import { useCallback, useState } from 'react';

/**
 * สำหรับ pull-to-refresh: แยก "ผู้ใช้ดึงเพื่อรีเฟรช" ออกจาก background refetch
 * เพื่อไม่ให้ spinner ของ RefreshControl โผล่ทุกครั้งที่ React Query refetch เอง
 *
 * @example
 * const { refetch } = useQuery(...);
 * const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch);
 * <FlashList refreshing={isRefetchingByUser} onRefresh={refetchByUser} />
 */
export function useRefreshByUser(refetch: () => Promise<unknown>) {
  const [isRefetchingByUser, setIsRefetchingByUser] = useState(false);

  const refetchByUser = useCallback(async () => {
    setIsRefetchingByUser(true);
    try {
      await refetch();
    } finally {
      setIsRefetchingByUser(false);
    }
  }, [refetch]);

  return { isRefetchingByUser, refetchByUser };
}
