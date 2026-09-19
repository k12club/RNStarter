import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';

import { DialogProvider } from '@/components/ui/DialogProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { initI18n } from '@/i18n';
import { createStore } from '@/store';
import { ThemeProvider } from '@/theme';

// ทดสอบด้วยภาษาไทยเสมอ (เรียกซ้ำได้ ถ้า init แล้วจะคืนตัวเดิม)
initI18n('th');

/**
 * render component พร้อม provider เหมือนในแอป
 * สร้าง store / QueryClient ใหม่ทุกครั้ง เพื่อไม่ให้ state รั่วข้าม test
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: Omit<RenderOptions, 'wrapper'> = {},
) {
  const store = createStore();
  const queryClient = new QueryClient({
    defaultOptions: {
      // gcTime Infinity = ไม่ตั้ง timer ลบ cache ค้างไว้หลัง test จบ (ทำให้ Jest worker ปิดไม่ลง)
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <BottomSheetModalProvider>
                  <ToastProvider>
                    <DialogProvider>{children}</DialogProvider>
                  </ToastProvider>
                </BottomSheetModalProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </ReduxProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return render(ui, { ...options, wrapper: Wrapper });
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
