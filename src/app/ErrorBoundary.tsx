import i18n from 'i18next';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { logger } from '@/utils/logger';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * จับ error ระหว่าง render ทั้งแอป แล้วแสดงหน้าจอให้เริ่มใหม่
 * ไม่จับ error ใน event handler / async (ให้จัดการด้วย try/catch หรือ React Query)
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // จุดต่อ crash reporter (Sentry / Crashlytics) ถ้าเพิ่มภายหลัง
    logger.error('ErrorBoundary', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const theme = useTheme();

  useEffect(() => {
    // พังก่อน NavigationContainer พร้อม = onReady ไม่ถูกเรียก splash จะค้างทับหน้านี้ตลอด
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h2" align="center">
          {i18n.t('errors:boundaryTitle')}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {i18n.t('errors:boundaryMessage')}
        </Text>
        {__DEV__ ? (
          <Text
            variant="bodySmall"
            color="danger"
            style={[styles.devMessage, { borderColor: theme.colors.border }]}
          >
            {error.message}
          </Text>
        ) : null}
        <Button
          title={i18n.t('errors:boundaryAction')}
          onPress={onReset}
          fullWidth
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  devMessage: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});
