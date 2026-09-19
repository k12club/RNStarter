import { QueryClientProvider } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';

import { queryClient } from '@/services/query/queryClient';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { selectThemePreference } from '@/store/slices/settingsSlice';
import { ThemeProvider, useTheme } from '@/theme';
import { buildCssVars } from '@/theme/cssVars';

/**
 * ลำดับ provider (นอกสุด -> ในสุด)
 * GestureHandlerRootView  ต้องอยู่นอกสุด ไม่งั้น gesture / bottom sheet ไม่ทำงาน
 * SafeAreaProvider        ระยะขอบจอ (notch / home indicator / edge-to-edge)
 * ReduxProvider           state ฝั่ง client
 * QueryClientProvider     state ฝั่ง server
 * ThemeProvider           อ่าน themePreference จาก Redux
 * KeyboardProvider        การจัดการคีย์บอร์ด (react-native-keyboard-controller)
 * ThemeCssVars            ส่งสีของ theme ปัจจุบันเป็น CSS variables ให้ className ของ NativeWind
 *
 * provider ที่ต้องใช้ navigation (BottomSheetModalProvider, Toast, Dialog) อยู่ใน RootNavigator
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <ThemedProviders>{children}</ThemedProviders>
          </QueryClientProvider>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedProviders({ children }: { children: React.ReactNode }) {
  const preference = useAppSelector(selectThemePreference);
  return (
    <ThemeProvider preference={preference}>
      <ThemeCssVars>
        <KeyboardProvider>{children}</KeyboardProvider>
      </ThemeCssVars>
    </ThemeProvider>
  );
}

/** className เช่น bg-surface / text-fg อ่านค่าจาก CSS variables ชุดนี้ (สลับตาม light / dark) */
function ThemeCssVars({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const cssVars = useMemo(() => buildCssVars(theme.colors), [theme.colors]);
  return <View style={[styles.root, cssVars]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
