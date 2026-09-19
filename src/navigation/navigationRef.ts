import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * ใช้ navigate จากนอก component (เช่น จาก notification handler / redux listener)
 * ใน component ให้ใช้ useNavigation() ตามปกติ
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<T extends keyof RootStackParamList>(
  ...args: undefined extends RootStackParamList[T]
    ? [screen: T, params?: RootStackParamList[T]]
    : [screen: T, params: RootStackParamList[T]]
) {
  if (navigationRef.isReady()) {
    const [screen, params] = args;
    navigationRef.dispatch(CommonActions.navigate(screen, params));
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}
