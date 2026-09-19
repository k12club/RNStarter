import '../global.css';

import React, { useEffect } from 'react';

import { restoreSession } from '@/features/auth/session';
import { RootNavigator } from '@/navigation/RootNavigator';

import { AppProviders } from './AppProviders';
import { bootstrap } from './bootstrap';
import { ErrorBoundary } from './ErrorBoundary';

// ตั้งค่า i18n / API / React Query ก่อน render แรก (sync)
bootstrap();

export default function App() {
  useEffect(() => {
    // อ่าน token จาก Keychain -> ตั้งสถานะ auth -> RootNavigator render -> ซ่อน splash
    restoreSession();
  }, []);

  return (
    <ErrorBoundary>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </ErrorBoundary>
  );
}
