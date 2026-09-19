import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import {
  Badge,
  type BadgeStatus,
  Card,
  Icon,
  type IconName,
  OfflineBanner,
  Screen,
  Section,
  Skeleton,
  Text,
} from '@/components/ui';
import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { useRefreshByUser } from '@/hooks';
import type { MainTabScreenProps } from '@/navigation/types';
import { makeStyles, useTheme } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';

// หน้าใน tab: header ของ tab navigator เว้นด้านบนให้แล้ว และ tab bar เว้นด้านล่างให้แล้ว
const SCREEN_EDGES: readonly Edge[] = [];

const DOCS_URL = 'https://reactnative.dev/docs/getting-started';

type QuickActionKey = 'products' | 'gallery' | 'settings' | 'docs';

type QuickAction = {
  key: QuickActionKey;
  icon: IconName;
  onPress: () => void;
};

type StackGroupKey = 'core' | 'data' | 'ui' | 'tooling';

/** ชื่อไลบรารีเป็นชื่อเฉพาะ ไม่ต้องแปล (หัวข้อกลุ่มแปลผ่าน i18n) */
const STACK_GROUPS: ReadonlyArray<{
  key: StackGroupKey;
  status: BadgeStatus;
  items: readonly string[];
}> = [
  {
    key: 'core',
    status: 'primary',
    items: [
      'React Native 0.87',
      'React 19',
      'TypeScript 6',
      'Hermes',
      'New Architecture',
    ],
  },
  {
    key: 'data',
    status: 'neutral',
    items: [
      'React Navigation 7',
      'Redux Toolkit',
      'React Query',
      'Axios',
      'MMKV',
      'Keychain',
    ],
  },
  {
    key: 'ui',
    status: 'neutral',
    items: [
      'NativeWind 4',
      'Reanimated 4',
      'Gesture Handler',
      'Bottom Sheet',
      'FlashList',
      'Lucide',
    ],
  },
  {
    key: 'tooling',
    status: 'neutral',
    items: [
      'React Hook Form',
      'Zod 4',
      'i18next',
      'Day.js',
      'Jest',
      'Testing Library',
    ],
  },
];

// ค่าตัวอย่างสำหรับสาธิต utils/format
const SAMPLE_SALES = 123456.78;
const SAMPLE_VISITORS = 9876543;

/** แบ่งรายการเป็นแถวละ n ช่อง (ตาราง 2 คอลัมน์ที่ความกว้างเท่ากันเสมอ) */
function toRows<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation(['home', 'common']);
  const theme = useTheme();
  const styles = useStyles();
  const { user, isLoading, refetch } = useCurrentUser();
  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch);

  const actions: QuickAction[] = [
    {
      key: 'products',
      icon: 'shopping-bag',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Products' }),
    },
    {
      key: 'gallery',
      icon: 'layout-grid',
      onPress: () => navigation.navigate('ComponentGallery'),
    },
    {
      key: 'settings',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      key: 'docs',
      icon: 'file-text',
      onPress: () =>
        navigation.navigate('WebView', {
          url: DOCS_URL,
          title: t('home:docsTitle'),
        }),
    },
  ];

  const stats: Array<{
    key: 'currency' | 'number' | 'date';
    icon: IconName;
    value: string;
    source: string;
  }> = [
    {
      key: 'currency',
      icon: 'wallet',
      value: formatCurrency(SAMPLE_SALES),
      source: 'formatCurrency()',
    },
    {
      key: 'number',
      icon: 'user',
      value: formatNumber(SAMPLE_VISITORS, { decimals: 0 }),
      source: 'formatNumber()',
    },
    {
      key: 'date',
      icon: 'calendar',
      value: formatDate(new Date(), 'dateLong'),
      source: "formatDate(date, 'dateLong')",
    },
  ];

  // ยังไม่มี user ใน Redux และกำลังโหลดจาก /auth/me ครั้งแรก
  const showGreetingSkeleton = !user && isLoading;

  return (
    <Screen
      scroll
      padded
      edges={SCREEN_EDGES}
      header={<OfflineBanner testID="home-offline-banner" />}
      refreshing={isRefetchingByUser}
      onRefresh={refetchByUser}
      scrollProps={{ testID: 'home-scroll' }}
      testID="home-screen"
    >
      <View className="gap-8 pb-8 pt-5">
        <View className="gap-1">
          {showGreetingSkeleton ? (
            <Skeleton
              variant="rect"
              width="60%"
              height={theme.typeScale.h2.lineHeight}
              radius="sm"
              accessibilityLabel={t('home:loadingUser')}
              testID="home-greeting-skeleton"
            />
          ) : (
            <Text
              variant="h2"
              accessibilityRole="header"
              testID="home-greeting"
            >
              {user
                ? t('home:greeting', { name: user.firstName })
                : t('home:greetingGuest')}
            </Text>
          )}
          <Text variant="body" color="textSecondary">
            {t('home:subtitle')}
          </Text>
        </View>

        <Section title={t('home:quickActions')}>
          {toRows(actions, 2).map(row => (
            <View key={row[0].key} className="flex-row gap-3">
              {row.map(action => {
                const title = t(`home:actions.${action.key}.title`);
                const description = t(`home:actions.${action.key}.description`);
                return (
                  <Card
                    key={action.key}
                    bordered
                    onPress={action.onPress}
                    accessibilityLabel={title}
                    accessibilityHint={description}
                    style={styles.actionCard}
                    testID={`home-action-${action.key}`}
                  >
                    <View className="gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-md bg-primary-soft">
                        <Icon name={action.icon} color="onPrimarySoft" />
                      </View>
                      <View>
                        <Text variant="title">{title}</Text>
                        <Text variant="caption" color="textSecondary">
                          {description}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ))}
        </Section>

        <Section
          title={t('home:stack.title')}
          description={t('home:stack.description')}
        >
          <Card bordered elevation="none" testID="home-stack">
            <View className="gap-5">
              {STACK_GROUPS.map(group => (
                <View key={group.key} className="gap-2">
                  <Text variant="label" color="textSecondary">
                    {t(`home:stack.${group.key}`)}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.items.map(item => (
                      <Badge key={item} label={item} status={group.status} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section
          title={t('home:stats.title')}
          description={t('home:stats.description')}
        >
          {stats.map(stat => (
            <Card key={stat.key} bordered testID={`home-stat-${stat.key}`}>
              <View className="flex-row items-center gap-3">
                <View style={styles.statIcon}>
                  <Icon name={stat.icon} color="textSecondary" />
                </View>
                <View className="flex-1">
                  <Text variant="caption" color="textSecondary">
                    {t(`home:stats.${stat.key}`)}
                  </Text>
                  <Text variant="h3">{stat.value}</Text>
                  <Text variant="caption" color="textTertiary">
                    {stat.source}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </Section>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  // การ์ดสองใบในแถวกว้างเท่ากัน และสูงอย่างน้อยเท่าพื้นที่แตะ
  actionCard: {
    flex: 1,
    minHeight: theme.sizes.touchTarget,
  },
  statIcon: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
  },
}));
