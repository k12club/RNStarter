import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * เชื่อม React Query เข้ากับ lifecycle ของ React Native
 * - กลับเข้าแอป (AppState active) = window focus -> refetch query ที่ stale
 * - ออฟไลน์ -> query หยุดรอ, กลับมาออนไลน์ -> ทำต่อ
 *
 * เรียกครั้งเดียวใน bootstrap คืนฟังก์ชันสำหรับยกเลิก listener
 */
export function setupQueryManagers() {
  onlineManager.setEventListener(setOnline => {
    return NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected);
    });
  });

  const onAppStateChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };
  const subscription = AppState.addEventListener('change', onAppStateChange);

  return () => {
    subscription.remove();
  };
}
