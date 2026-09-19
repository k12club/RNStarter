import { useFocusEffect } from '@react-navigation/native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Linking, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import {
  EmptyState,
  ErrorState,
  IconButton,
  ProgressBar,
  Screen,
  useToast,
} from '@/components/ui';
import type { RootStackScreenProps } from '@/navigation/types';
import type { ApiError } from '@/services/api/errors';
import { makeStyles } from '@/theme';
import { logger } from '@/utils/logger';

import { getNavigationDecision, isHttpsUrl, toWebViewError } from '../utils';

// ให้ทุก url ผ่านมาที่ handleShouldStartLoad (ตัดสินด้วย getNavigationDecision)
// whitelist ของ library ส่ง url ที่ไม่ผ่านให้ระบบเปิดทันทีโดยไม่ดูว่ามาจาก iframe (iOS)
const ORIGIN_WHITELIST = ['*'];

// https โหลดในแอป, ลิงก์อื่นใน frame หลัก (http, tel:, mailto: ...) ส่งให้ระบบเปิด, iframe ไม่ใช่ https ไม่เปิด
// ShouldStartLoadRequest ไม่ถูก export จาก index ของ library และ Android ไม่ส่ง isTopFrame มา
function handleShouldStartLoad(
  request: WebViewNavigation & { isTopFrame?: boolean },
) {
  const decision = getNavigationDecision(request.url, request.isTopFrame);
  if (decision === 'external') {
    Linking.openURL(request.url).catch(error => {
      logger.warn('webview: open external url failed', error);
    });
  }
  return decision === 'load';
}

// type ของ react-native-webview ใช้ generic ค่าเริ่มต้นเป็น undefined ทำให้ props กลายเป็น never
// จึงระบุ generic เป็น object เอง (WebViewProps & object = WebViewProps)
type WebViewRef = WebView<object>;

/** ปุ่มเปิดหน้าปัจจุบันในเบราว์เซอร์ของระบบ (อยู่ใน native header) */
function OpenInBrowserButton({ url }: { url: string }) {
  const { t } = useTranslation('profile');
  const toast = useToast();

  const handlePress = async () => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error(t('webview.openFailed'));
    }
  };

  return (
    <IconButton
      testID="webview-open-external"
      icon="external-link"
      accessibilityLabel={t('webview.openInBrowser')}
      onPress={handlePress}
    />
  );
}

// ประกาศนอก component เพื่อไม่ให้สร้าง component ใหม่ทุก render (react/no-unstable-nested-components)
function makeHeaderRight(url: string) {
  return () => <OpenInBrowserButton url={url} />;
}

export function WebViewScreen({
  navigation,
  route,
}: RootStackScreenProps<'WebView'>) {
  const { url } = route.params;
  const { t } = useTranslation('profile');
  const styles = useStyles();
  const webViewRef = useRef<WebViewRef>(null);
  const isSecure = isHttpsUrl(url);
  // คง object เดิมทุก render (progress อัปเดตถี่) ไม่ให้ native เห็นว่า source เปลี่ยนแล้วโหลดหน้าตั้งต้นซ้ำ
  const source = useMemo(() => ({ uri: url }), [url]);

  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ApiError | null>(null);

  // เปิดหน้าที่ผู้ใช้กำลังดูอยู่ (อาจกดลิงก์ไปหน้าอื่นแล้ว) ถ้าไม่ใช่ https ใช้ลิงก์ตั้งต้น
  const externalUrl = isHttpsUrl(currentUrl) ? currentUrl : url;

  useEffect(() => {
    navigation.setOptions({
      headerRight: isSecure ? makeHeaderRight(externalUrl) : undefined,
    });
  }, [navigation, isSecure, externalUrl]);

  // Android: ปุ่ม back ย้อนประวัติของหน้าเว็บก่อน ย้อนจนสุดแล้วจึงออกจากหน้านี้
  useFocusEffect(
    useCallback(() => {
      if (!canGoBack) {
        return undefined;
      }
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          // ย้อนไปหน้าก่อนแล้ว error ของหน้าที่โหลดไม่สำเร็จต้องหายด้วย (ถ้าหน้าก่อนพังจะถูกตั้งใหม่เอง)
          setError(null);
          webViewRef.current?.goBack();
          return true;
        },
      );
      return () => subscription.remove();
    }, [canGoBack]),
  );

  const handleNavigationStateChange = (state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
    setCurrentUrl(state.url);
  };

  const handleReload = () => {
    setError(null);
    setProgress(0);
    webViewRef.current?.reload();
  };

  const renderLoadingLayer = useCallback(
    () => <View testID="webview-reloading" style={styles.coverLayer} />,
    [styles.coverLayer],
  );

  if (!isSecure) {
    return (
      <Screen edges={['bottom']} padded>
        <EmptyState
          testID="webview-insecure"
          tone="danger"
          icon="lock"
          title={t('webview.insecureTitle')}
          description={t('webview.insecureMessage')}
          announce
          fill
        />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <WebView<object>
        ref={webViewRef}
        testID="webview"
        source={source}
        originWhitelist={ORIGIN_WHITELIST}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        // หลัง ref.reload() WebView แสดง loading ของตัวเองซึ่งพื้นขาวตายตัว (dark mode กะพริบขาว)
        // ใช้ชั้นสีพื้นหลังของ theme แทน ความคืบหน้าแสดงด้วย ProgressBar ด้านบนอยู่แล้ว
        renderLoading={renderLoadingLayer}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onNavigationStateChange={handleNavigationStateChange}
        onError={({ nativeEvent }) => setError(toWebViewError(nativeEvent))}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.statusCode >= 400) {
            setError(toWebViewError(nativeEvent));
          }
        }}
        style={styles.webView}
      />

      {progress < 1 && !error ? (
        <View className="absolute inset-x-0 top-0">
          <ProgressBar
            testID="webview-progress"
            value={progress}
            accessibilityLabel={t('webview.loading')}
          />
        </View>
      ) : null}

      {/* คง WebView ไว้ใต้หน้า error (ไม่ unmount) เพื่อให้ ref.reload() โหลดหน้าเดิมซ้ำได้ */}
      {error ? (
        <View style={styles.coverLayer}>
          <ErrorState
            testID="webview-error"
            error={error}
            title={t('webview.loadFailedTitle')}
            onRetry={handleReload}
            fill
          />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  webView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // ชั้นทึบสีพื้นหลังคลุม WebView (หน้า error / ระหว่าง reload)
  coverLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.background,
  },
}));
