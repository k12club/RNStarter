import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Chip,
  FormTextField,
  Icon,
  type IconName,
  Screen,
  Text,
  type TextColor,
} from '@/components/ui';
import { useLogin } from '@/features/auth/hooks/useAuth';
import {
  type AppLanguage,
  DEFAULT_LANGUAGE,
  isAppLanguage,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
} from '@/i18n/languages';
import type { RootStackScreenProps } from '@/navigation/types';
import { toApiError } from '@/services/api/errors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSessionExpired } from '@/store/slices/authSlice';
import { setLanguage } from '@/store/slices/settingsSlice';
import { makeStyles } from '@/theme';
import {
  type LoginFormValues,
  loginSchema,
  USERNAME_MIN_LENGTH,
} from '@/utils/schemas';

// ไม่มี header และไม่มี tab bar: เว้น safe area ทั้งบนและล่าง (เนื้อหาเลื่อนยาวถึงล่างจอ)
const SCREEN_EDGES: readonly Edge[] = ['top', 'bottom'];

// บัญชีทดลองของ DummyJSON (https://dummyjson.com/users) เปลี่ยนเป็น API จริงแล้วให้ลบการ์ดนี้ออก
const DEMO_ACCOUNT = { username: 'emilys', password: 'emilyspass' } as const;

const DEFAULT_VALUES: LoginFormValues = { username: '', password: '' };

/**
 * หน้าเข้าสู่ระบบ
 * login สำเร็จแล้วไม่ต้อง navigate เอง: startSession เปลี่ยน auth status เป็น signedIn
 * แล้ว RootNavigator สลับไปชุดหน้าจอหลักให้
 */
export function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { t, i18n } = useTranslation(['auth', 'common', 'errors']);
  const dispatch = useAppDispatch();
  const sessionExpired = useAppSelector(selectSessionExpired);
  const login = useLogin();

  const { control, handleSubmit, setValue, setFocus } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = (values: LoginFormValues) => {
    // ใช้ mutate (ไม่ใช่ mutateAsync) error ไปอยู่ที่ login.error ไม่หลุดเป็น unhandled rejection
    login.mutate(values);
  };

  const fillDemoAccount = () => {
    setValue('username', DEMO_ACCOUNT.username, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue('password', DEMO_ACCOUNT.password, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  // ภาษาจริงของ i18n (settings.language เป็น null จนกว่าผู้ใช้จะเลือกเอง)
  const currentLanguage: AppLanguage = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;

  const errorKind = login.error ? toApiError(login.error).kind : null;
  // DummyJSON ตอบ 400 เมื่อรหัสผิด: validation / unauthorized จึงแปลว่าข้อมูลเข้าสู่ระบบไม่ถูกต้อง
  const errorMessage =
    errorKind === null
      ? null
      : errorKind === 'validation' || errorKind === 'unauthorized'
      ? t('auth:invalidCredentials')
      : t(`errors:${errorKind}`);

  return (
    <Screen scroll padded edges={SCREEN_EDGES} testID="login-screen">
      <View className="flex-1 gap-6 pb-6 pt-2">
        <View className="flex-row items-center justify-between gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-lg bg-primary">
            <Icon name="layout-grid" size="lg" color="onPrimary" />
          </View>
          <View className="flex-1 flex-row flex-wrap justify-end gap-2">
            {SUPPORTED_LANGUAGES.map(language => (
              <Chip
                key={language}
                label={LANGUAGE_LABELS[language]}
                selected={language === currentLanguage}
                onPress={() => dispatch(setLanguage(language))}
                testID={`login-lang-${language}`}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text variant="h1" accessibilityRole="header">
            {t('auth:title')}
          </Text>
          <Text variant="body" color="textSecondary">
            {t('auth:subtitle')}
          </Text>
        </View>

        {sessionExpired ? (
          <Banner
            tone="warning"
            message={t('auth:sessionExpired')}
            testID="login-session-expired"
          />
        ) : null}

        <View className="gap-4">
          <FormTextField
            control={control}
            name="username"
            label={t('auth:username')}
            errorValues={{ count: USERNAME_MIN_LENGTH }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => setFocus('password')}
            disabled={login.isPending}
            testID="login-username"
          />
          <FormTextField
            control={control}
            name="password"
            type="password"
            label={t('auth:password')}
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={() => handleSubmit(onSubmit)()}
            disabled={login.isPending}
            testID="login-password"
          />
          {errorMessage ? (
            <Banner tone="danger" message={errorMessage} testID="login-error" />
          ) : null}
          <Button
            title={t('auth:submit')}
            size="lg"
            fullWidth
            loading={login.isPending}
            onPress={() => handleSubmit(onSubmit)()}
            testID="login-submit"
          />
        </View>

        <Card
          bordered
          elevation="none"
          testID="login-demo-card"
          footer={
            <Button
              variant="ghost"
              fullWidth
              title={t('auth:demo.fill')}
              left={<Icon name="pencil" size="sm" color="primary" />}
              onPress={fillDemoAccount}
              disabled={login.isPending}
              testID="login-fill-demo"
            />
          }
        >
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Icon name="info" size="sm" color="info" />
              <View className="flex-1">
                <Text variant="title">{t('auth:demo.title')}</Text>
              </View>
            </View>
            <Text variant="bodySmall" color="textSecondary">
              {t('auth:demo.description')}
            </Text>
            <View className="gap-2 rounded-md bg-surface-alt px-3 py-2">
              <DemoRow
                label={t('auth:username')}
                value={DEMO_ACCOUNT.username}
              />
              <DemoRow
                label={t('auth:password')}
                value={DEMO_ACCOUNT.password}
              />
            </View>
          </View>
        </Card>

        <View className="items-center">
          <Button
            variant="ghost"
            title={t('auth:openGallery')}
            left={<Icon name="layout-grid" size="sm" color="primary" />}
            onPress={() => navigation.navigate('ComponentGallery')}
            testID="login-open-gallery"
          />
        </View>
      </View>
    </Screen>
  );
}

type BannerTone = 'danger' | 'warning';

const BANNER_TONES: Record<
  BannerTone,
  { className: string; color: TextColor; icon: IconName }
> = {
  danger: {
    className: 'bg-danger-soft',
    color: 'onDangerSoft',
    icon: 'circle-alert',
  },
  warning: {
    className: 'bg-warning-soft',
    color: 'onWarningSoft',
    icon: 'clock',
  },
};

/** แถบข้อความแจ้งในหน้า (ประกาศให้ screen reader ทันทีที่แสดง) */
function Banner({
  tone,
  message,
  testID,
}: {
  tone: BannerTone;
  message: string;
  testID?: string;
}) {
  const styles = useStyles();
  const toneStyle = BANNER_TONES[tone];

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`flex-row items-start gap-3 rounded-md px-4 py-3 ${toneStyle.className}`}
    >
      <View style={styles.bannerIcon}>
        <Icon name={toneStyle.icon} size="sm" color={toneStyle.color} />
      </View>
      <View className="flex-1">
        <Text variant="bodySmall" color={toneStyle.color}>
          {message}
        </Text>
      </View>
    </View>
  );
}

/** แถวข้อมูลบัญชีทดลอง: ขึ้นบรรทัดใหม่ได้เมื่อจอแคบ ไม่ตัดค่า */
function DemoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-3">
      <Text variant="bodySmall" color="textSecondary">
        {label}
      </Text>
      <Text variant="body" weight="semibold" selectable>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  // ให้ icon อยู่กึ่งกลางบรรทัดแรกของข้อความ bodySmall
  bannerIcon: {
    height: theme.typeScale.bodySmall.lineHeight,
    justifyContent: 'center',
  },
}));
