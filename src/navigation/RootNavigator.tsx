import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { DialogProvider } from '@/components/ui/DialogProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { ComponentGalleryScreen } from '@/features/gallery/screens/ComponentGalleryScreen';
import { ProductDetailScreen } from '@/features/products/screens/ProductDetailScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { WebViewScreen } from '@/features/webview/screens/WebViewScreen';
import { useAppSelector } from '@/store/hooks';
import { selectAuthStatus } from '@/store/slices/authSlice';
import { useTheme } from '@/theme';

import { createLinking } from './linking';
import { MainTabs } from './MainTabs';
import { navigationRef } from './navigationRef';
import { toNavigationTheme } from './navigationTheme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navigator หลัก: สลับชุดหน้าจอตามสถานะ auth
 *
 * - status 'unknown' (ยังอ่าน token จาก Keychain ไม่เสร็จ) ไม่ render อะไรเลย splash จึงยังค้างอยู่
 *   และไม่มีจังหวะที่หน้า Login โผล่แวบก่อนเข้าหน้าแรก
 * - Toast / Dialog / BottomSheetModal อยู่ใน NavigationContainer จึงใช้ navigation hook ในเนื้อหาได้
 * - onReady ของ NavigationContainer = render หน้าแรกเสร็จแล้ว จึงซ่อน splash ตรงนั้น
 * - สลับกลุ่มหน้าจอด้วยเงื่อนไข (ไม่ navigate เอง): login สำเร็จ / ออกจากระบบ แล้ว stack จะรีเซ็ตให้เอง
 * - StatusBar: ใช้ของ RN (Info.plist UIViewControllerBasedStatusBarAppearance = NO)
 *   ห้ามใช้ option statusBar* ของ native-stack เพราะต้องตั้ง Info.plist ตรงข้ามกัน
 */
export function RootNavigator() {
  const { t } = useTranslation(['common', 'settings', 'gallery']);
  const theme = useTheme();
  const status = useAppSelector(selectAuthStatus);
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);
  const linking = useMemo(
    () => createLinking(status === 'signedIn' ? 'MainTabs' : 'Login'),
    [status],
  );

  if (status === 'unknown') {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      linking={linking}
      onReady={() => {
        BootSplash.hide({ fade: true });
      }}
    >
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      {/* ToastProvider อยู่นอก BottomSheetModalProvider เพื่อให้ toast แสดงเหนือ bottom sheet */}
      <ToastProvider>
        <BottomSheetModalProvider>
          <DialogProvider>
            <Stack.Navigator
              screenOptions={{
                headerTitleStyle: { fontFamily: theme.fonts.heading.medium },
                headerBackButtonDisplayMode: 'minimal',
              }}
            >
              {status === 'signedIn' ? (
                <Stack.Group>
                  <Stack.Screen
                    name="MainTabs"
                    component={MainTabs}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="ProductDetail"
                    component={ProductDetailScreen}
                    options={({ route }) => ({
                      title: route.params.title ?? '',
                    })}
                  />
                  <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: t('settings:title') }}
                  />
                </Stack.Group>
              ) : (
                <Stack.Group screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Login" component={LoginScreen} />
                </Stack.Group>
              )}

              {/* เปิดได้ทั้งก่อนและหลังเข้าสู่ระบบ */}
              <Stack.Group>
                <Stack.Screen
                  name="ComponentGallery"
                  component={ComponentGalleryScreen}
                  options={{ title: t('gallery:title') }}
                />
                <Stack.Screen
                  name="WebView"
                  component={WebViewScreen}
                  options={({ route }) => ({ title: route.params.title ?? '' })}
                />
              </Stack.Group>
            </Stack.Navigator>
          </DialogProvider>
        </BottomSheetModalProvider>
      </ToastProvider>
    </NavigationContainer>
  );
}
