import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import BootSplash from 'react-native-bootsplash';

import { ErrorBoundary } from '@/app/ErrorBoundary';
import { Text } from '@/components/ui/Text';
import { initI18n } from '@/i18n';

initI18n('th');

let shouldThrow = true;

function Flaky() {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text>ok</Text>;
}

beforeEach(() => {
  shouldThrow = true;
  jest.clearAllMocks();
  // React + logger.error พิมพ์ error ที่จับได้: ปิดเสียงไว้
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('render พังก่อน NavigationContainer พร้อม: แสดงหน้า error และซ่อน splash', async () => {
  await render(
    <ErrorBoundary>
      <Flaky />
    </ErrorBoundary>,
  );

  expect(screen.getByText('มีบางอย่างผิดพลาด')).toBeOnTheScreen();
  // ไม่งั้น splash ของ native ค้างทับหน้านี้ ผู้ใช้กดเริ่มใหม่ไม่ได้
  expect(BootSplash.hide).toHaveBeenCalled();
});

test('กดเริ่มใหม่แล้ว render children อีกครั้ง', async () => {
  const user = userEvent.setup();
  await render(
    <ErrorBoundary>
      <Flaky />
    </ErrorBoundary>,
  );

  shouldThrow = false;
  await user.press(screen.getByText('เริ่มใหม่'));

  expect(await screen.findByText('ok')).toBeOnTheScreen();
});
