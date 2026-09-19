import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import {
  Card,
  Divider,
  ListItem,
  RadioGroup,
  Screen,
  Section,
  SegmentedControl,
  type SegmentedOption,
  Switch,
  useToast,
} from '@/components/ui';
import { env } from '@/config/env';
import {
  type AppLanguage,
  DEFAULT_LANGUAGE,
  isAppLanguage,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
} from '@/i18n/languages';
import { queryClient } from '@/services/query/queryClient';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectLanguage,
  selectThemePreference,
  setLanguage,
  setThemePreference,
} from '@/store/slices/settingsSlice';
import { makeStyles, type ThemePreference } from '@/theme';

import { InfoRow } from '../components/InfoRow';

// ชื่อภาษาแสดงด้วยภาษาของตัวเองเสมอ (ไม่แปล) ผู้ใช้จึงหาภาษาของตัวเองเจอแม้เลือกผิด
const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map(language => ({
  value: language,
  label: LANGUAGE_LABELS[language],
}));

function getReactNativeVersion() {
  const { major, minor, patch } = Platform.constants.reactNativeVersion;
  return `${major}.${minor}.${patch}`;
}

type NotificationPrefs = {
  push: boolean;
  email: boolean;
  promotions: boolean;
};

export function SettingsScreen() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const themePreference = useAppSelector(selectThemePreference);
  const savedLanguage = useAppSelector(selectLanguage);

  // ยังไม่เคยเลือก (null) = แสดงภาษาที่ i18n ใช้อยู่ตอนนี้ (ภาษาเครื่อง / ไทย)
  const language: AppLanguage =
    savedLanguage ??
    (isAppLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE);

  // ตัวอย่างเท่านั้น: เก็บใน state ของหน้า ออกจากหน้าแล้วค่าหาย
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    push: true,
    email: false,
    promotions: false,
  });

  const toggle = (key: keyof NotificationPrefs) => (value: boolean) =>
    setNotifications(current => ({ ...current, [key]: value }));

  const themeOptions: SegmentedOption<ThemePreference>[] = [
    { value: 'system', label: t('appearance.system') },
    { value: 'light', label: t('appearance.light') },
    { value: 'dark', label: t('appearance.dark') },
  ];

  const handleClearCache = () => {
    queryClient.clear();
    toast.success(t('cacheCleared'));
  };

  const aboutRows = [
    {
      key: 'version',
      label: t('about.version'),
      value: DeviceInfo.getVersion(),
    },
    {
      key: 'build',
      label: t('about.buildNumber'),
      value: DeviceInfo.getBuildNumber(),
    },
    {
      key: 'bundle-id',
      label: t('about.bundleId'),
      value: DeviceInfo.getBundleId(),
    },
    { key: 'env', label: t('about.environment'), value: env.appEnv },
    { key: 'api-url', label: t('about.apiUrl'), value: env.apiUrl },
    {
      key: 'rn-version',
      label: t('about.reactNativeVersion'),
      value: getReactNativeVersion(),
    },
  ];

  return (
    <Screen scroll padded edges={['bottom']}>
      <View style={styles.content}>
        <Section
          title={t('appearance.title')}
          description={t('appearance.description')}
        >
          <SegmentedControl
            testID="settings-theme"
            accessibilityLabel={t('appearance.label')}
            options={themeOptions}
            value={themePreference}
            onChange={value => dispatch(setThemePreference(value))}
          />
        </Section>

        <Section
          title={t('language.title')}
          description={t('language.description')}
        >
          <Card padding="md">
            <RadioGroup
              testID="settings-language"
              options={LANGUAGE_OPTIONS}
              value={language}
              onChange={value => dispatch(setLanguage(value))}
            />
          </Card>
        </Section>

        <Section
          title={t('notifications.title')}
          description={t('notifications.demoCaption')}
        >
          <Card padding="md">
            <Switch
              testID="settings-notify-push"
              label={t('notifications.pushLabel')}
              description={t('notifications.pushDescription')}
              value={notifications.push}
              onValueChange={toggle('push')}
            />
            <Divider spacing="xs" />
            <Switch
              testID="settings-notify-email"
              label={t('notifications.emailLabel')}
              description={t('notifications.emailDescription')}
              value={notifications.email}
              onValueChange={toggle('email')}
            />
            <Divider spacing="xs" />
            <Switch
              testID="settings-notify-promotions"
              label={t('notifications.promotionsLabel')}
              description={t('notifications.promotionsDescription')}
              value={notifications.promotions}
              onValueChange={toggle('promotions')}
            />
          </Card>
        </Section>

        <Section title={t('data.title')}>
          <Card padding="none">
            <ListItem
              testID="settings-clear-cache"
              left="trash"
              title={t('data.clearCache')}
              subtitle={t('data.clearCacheDescription')}
              onPress={handleClearCache}
              style={styles.singleRow}
            />
          </Card>
        </Section>

        <Section title={t('about.title')}>
          <Card padding="none">
            {aboutRows.map((row, index) => (
              <React.Fragment key={row.key}>
                {index > 0 ? <Divider inset="lg" /> : null}
                <InfoRow
                  testID={`settings-about-${row.key}`}
                  label={row.label}
                  value={row.value}
                />
              </React.Fragment>
            ))}
          </Card>
        </Section>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  content: {
    gap: theme.spacing.xxxl,
    paddingVertical: theme.spacing.xl,
  },
  // สีตอนกดต้องโค้งตาม Card (Card ไม่ใช้ overflow hidden เพราะจะตัดเงา)
  singleRow: {
    borderRadius: theme.radius.lg,
  },
}));
