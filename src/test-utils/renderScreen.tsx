import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RenderOptions } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/types';

import { renderWithProviders } from './renderWithProviders';

const Stack = createNativeStackNavigator<Record<string, object | undefined>>();

const ALL_ROUTES: Array<keyof RootStackParamList> = [
  'Login',
  'MainTabs',
  'ProductDetail',
  'Settings',
  'ComponentGallery',
  'WebView',
];

/** หน้าปลายทางจำลอง: แสดงชื่อ route + params เพื่อใช้ตรวจว่า navigate ไปถูกที่ */
function StubScreen({ route }: { route: { name: string; params?: object } }) {
  return (
    <View>
      <Text>{`route:${route.name}`}</Text>
      <Text>{`params:${JSON.stringify(route.params ?? {})}`}</Text>
    </View>
  );
}

type RenderScreenOptions = Omit<RenderOptions, 'wrapper'> & {
  /** ชื่อ route ของหน้าที่ทดสอบ (ใช้กับ useRoute / route.params) */
  routeName?: string;
  params?: object;
};

/**
 * render หน้าจอใน NavigationContainer จริง + provider ทั้งหมดของแอป
 * route อื่นทั้งหมดใน RootStackParamList เป็น StubScreen
 *
 * @example
 * await renderScreen(<ProductDetailScreen />, { routeName: 'ProductDetail', params: { id: 1 } });
 * await user.press(screen.getByText('...'));
 * expect(await screen.findByText('route:Settings')).toBeOnTheScreen();
 */
export function renderScreen(
  ScreenComponent: React.ComponentType<any>,
  {
    routeName = 'ScreenUnderTest',
    params,
    ...options
  }: RenderScreenOptions = {},
) {
  return renderWithProviders(
    <NavigationContainer>
      <Stack.Navigator initialRouteName={routeName}>
        <Stack.Screen
          name={routeName}
          component={ScreenComponent}
          initialParams={params}
        />
        {ALL_ROUTES.filter(name => name !== routeName).map(name => (
          <Stack.Screen key={name} name={name} component={StubScreen} />
        ))}
      </Stack.Navigator>
    </NavigationContainer>,
    options,
  );
}
