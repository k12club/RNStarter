import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import {
  Avatar,
  Card,
  Divider,
  ErrorState,
  type IconName,
  ListItem,
  LoadingOverlay,
  Screen,
  Skeleton,
  Text,
  useDialog,
  useToast,
} from '@/components/ui';
import { useCurrentUser, useLogout } from '@/features/auth/hooks/useAuth';
import { useRefreshByUser } from '@/hooks';
import type { MainTabScreenProps } from '@/navigation/types';
import type { AuthUser } from '@/store/slices/authSlice';
import { makeStyles, useTheme } from '@/theme';

// หน้าเว็บที่เปิดใน WebView (หน้า WebView รับเฉพาะ https)
const PRIVACY_URL = 'https://reactnative.dev/docs/security';
const HELP_URL = 'https://reactnative.dev/help';

type MenuItem = {
  key: string;
  icon: IconName;
  title: string;
  testID: string;
  onPress?: () => void;
  value?: string;
};

function getFullName(user: AuthUser) {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.username;
}

export function ProfileScreen({ navigation }: MainTabScreenProps<'Profile'>) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const styles = useStyles();
  const dialog = useDialog();
  const toast = useToast();
  const { user, isError, error, refetch } = useCurrentUser();
  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch);
  const logout = useLogout();
  const confirmingRef = useRef(false);

  // ค่าคงที่จาก native อ่านแบบ sync ได้ (ห้ามเรียก isEmulator: crash บน Android 15/16)
  const appVersion = `${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`;
  // เส้นแบ่งเริ่มตรงข้อความ: padding ซ้ายของ ListItem + icon + ระยะห่าง
  const dividerInset =
    theme.spacing.lg + theme.sizes.icon.md + theme.spacing.md;

  const handleLogout = async () => {
    // กดซ้ำเร็ว ๆ ก่อน dialog ขึ้น จะได้ dialog ซ้อนในคิว (อันที่สองโผล่บนหน้า Login หลังออกจากระบบแล้ว)
    if (confirmingRef.current) {
      return;
    }
    confirmingRef.current = true;
    let confirmed = false;
    try {
      confirmed = await dialog.confirm({
        title: t('logout.confirmTitle'),
        message: t('logout.confirmMessage'),
        confirmLabel: t('logout.confirmLabel'),
        destructive: true,
      });
    } finally {
      confirmingRef.current = false;
    }
    if (!confirmed) {
      return;
    }
    logout.mutate(undefined, {
      onError: () => toast.error(t('logout.failed')),
    });
  };

  const menu: MenuItem[] = [
    {
      key: 'settings',
      icon: 'settings',
      title: t('menu.settings'),
      testID: 'profile-settings',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      key: 'gallery',
      icon: 'layout-grid',
      title: t('menu.gallery'),
      testID: 'profile-gallery',
      onPress: () => navigation.navigate('ComponentGallery'),
    },
    {
      key: 'privacy',
      icon: 'shield-check',
      title: t('menu.privacy'),
      testID: 'profile-privacy',
      onPress: () =>
        navigation.navigate('WebView', {
          url: PRIVACY_URL,
          title: t('menu.privacy'),
        }),
    },
    {
      key: 'help',
      icon: 'circle-help',
      title: t('menu.help'),
      testID: 'profile-help',
      onPress: () =>
        navigation.navigate('WebView', {
          url: HELP_URL,
          title: t('menu.help'),
        }),
    },
    {
      key: 'about',
      icon: 'info',
      title: t('menu.about'),
      testID: 'profile-about',
      value: appVersion,
    },
  ];

  let header: React.ReactNode;
  if (user) {
    const fullName = getFullName(user);
    header = (
      <View testID="profile-header" className="flex-row items-center gap-4">
        <Avatar uri={user.image} name={fullName} size="lg" />
        <View style={styles.headerTexts}>
          <Text variant="h3">{fullName}</Text>
          <Text variant="bodySmall" color="textSecondary">
            {user.email}
          </Text>
          <Text variant="bodySmall" color="textSecondary">
            {t('usernameHandle', { username: user.username })}
          </Text>
        </View>
      </View>
    );
  } else if (isError) {
    header = (
      // กดลองอีกครั้งแล้ว React Query v5 เปลี่ยนสถานะกลับเป็น pending (ยังไม่มีข้อมูล)
      // หน้าจอจึงแสดง skeleton ระหว่างโหลดเหมือนตอนเปิดครั้งแรก
      <ErrorState error={error} onRetry={() => refetch()} />
    );
  } else {
    header = (
      <View
        testID="profile-skeleton"
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('loadingProfile')}
        accessibilityState={{ busy: true }}
        className="flex-row items-center gap-4"
      >
        <Skeleton variant="circle" height={theme.sizes.avatar.lg} />
        <View style={styles.headerTexts}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" lines={2} lastLineWidth="45%" />
        </View>
      </View>
    );
  }

  return (
    <Screen
      scroll
      padded
      edges={[]}
      refreshing={isRefetchingByUser}
      onRefresh={refetchByUser}
      overlay={
        <LoadingOverlay
          visible={logout.isPending}
          message={t('logout.pending')}
          testID="profile-logout-overlay"
        />
      }
    >
      <View style={styles.content}>
        <Card>{header}</Card>

        <Card padding="none">
          {menu.map((item, index) => (
            <React.Fragment key={item.key}>
              {index > 0 ? <Divider inset={dividerInset} /> : null}
              <ListItem
                testID={item.testID}
                left={item.icon}
                title={item.title}
                value={item.value}
                chevron={!!item.onPress}
                onPress={item.onPress}
                style={index === 0 ? styles.firstRow : undefined}
              />
            </React.Fragment>
          ))}
        </Card>

        <Card padding="none">
          <ListItem
            testID="profile-logout"
            left="log-out"
            title={t('logout.action')}
            destructive
            disabled={logout.isPending}
            onPress={handleLogout}
            style={styles.singleRow}
          />
        </Card>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
  },
  headerTexts: {
    flex: 1,
    flexShrink: 1,
    gap: theme.spacing.xxs,
  },
  // สีตอนกดของแถวบนสุด / แถวเดียว ต้องโค้งตาม Card (Card ไม่ใช้ overflow hidden เพราะจะตัดเงา)
  firstRow: {
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  singleRow: {
    borderRadius: theme.radius.lg,
  },
}));
