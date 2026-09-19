import { useNetInfo } from '@react-native-community/netinfo';

/**
 * สถานะอินเทอร์เน็ต
 * isOffline = true เฉพาะเมื่อรู้แน่ว่าไม่มีเน็ต (ตอนเปิดแอปใหม่ ๆ ค่ายังเป็น null จะไม่ถือว่า offline)
 */
export function useNetworkStatus() {
  const netInfo = useNetInfo();
  return {
    isConnected: netInfo.isConnected,
    isInternetReachable: netInfo.isInternetReachable,
    isOffline:
      netInfo.isConnected === false || netInfo.isInternetReachable === false,
    type: netInfo.type,
  };
}
