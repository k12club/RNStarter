import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from '@/components/ui/Icon';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { ProductListScreen } from '@/features/products/screens/ProductListScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { useTheme } from '@/theme';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, IconName> = {
  Home: 'house',
  Products: 'shopping-bag',
  Profile: 'user',
};

type TabIconProps = { color: string; size: number };

// ประกาศนอก component เพื่อไม่ให้สร้าง component ใหม่ทุก render (react/no-unstable-nested-components)
const tabIconRenderers = Object.fromEntries(
  Object.entries(TAB_ICONS).map(([route, icon]) => [
    route,
    ({ color, size }: TabIconProps) => (
      <Icon name={icon} color={color} size={size} />
    ),
  ]),
) as Record<keyof MainTabParamList, (props: TabIconProps) => React.ReactNode>;

export function MainTabs() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleStyle: { fontFamily: theme.fonts.heading.medium },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        // ป้ายใต้ icon เป็นภาษาไทยได้: ต้อง >= 14 และ lineHeight พอสำหรับสระ
        tabBarLabelStyle: {
          fontFamily: theme.fonts.body.medium,
          fontSize: 14,
          lineHeight: 20,
        },
        tabBarIcon: tabIconRenderers[route.name],
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('tabs.home'), tabBarButtonTestID: 'tab-home' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{
          title: t('tabs.products'),
          tabBarButtonTestID: 'tab-products',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('tabs.profile'),
          tabBarButtonTestID: 'tab-profile',
        }}
      />
    </Tab.Navigator>
  );
}
