/* eslint-env jest */
/**
 * Mock ของ native module สำหรับ Jest (โหลดหลัง environment พร้อม)
 * ทุกตัวในไฟล์นี้จำเป็น: ถ้าเอาออก test จะพังด้วย error "... could not be found" / "is not linked"
 * เพิ่ม native library ใหม่: ใส่ mock ที่นี่ และถ้าแพ็กเกจส่ง ESM ให้เพิ่มชื่อใน jest.config.js
 */

// Worklets (web implementation ที่ resolver เลือกให้) โยน error ใน getUIRuntimeHolder
// ซึ่ง gesture-handler 3.x เรียกตอน import
jest.mock('react-native-worklets', () => ({
  ...jest.requireActual('react-native-worklets'),
  getUIRuntimeHolder: () => ({}),
}));
require('react-native-reanimated').setUpTests();

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('react-native-localize', () => {
  const mock = require('react-native-localize/mock/jest');
  mock.findBestLanguageTag.mockReturnValue({ languageTag: 'th', isRTL: false });
  return mock;
});

// mock ของ bottom-sheet เป็น CJS ไม่มี __esModule: ต้องใส่เอง ไม่งั้น default import ได้ object ทั้งก้อน
jest.mock('@gorhom/bottom-sheet', () => ({
  __esModule: true,
  ...require('@gorhom/bottom-sheet/mock'),
}));

// MMKV v4 ใช้ mock ในหน่วยความจำเองเมื่ออยู่ใน Jest แต่ยัง import nitro-modules ตอนโหลด
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(() => {
      throw new Error('NitroModules is not available in Jest');
    }),
  },
}));

// Keychain: เก็บในหน่วยความจำ
jest.mock('react-native-keychain', () => {
  const store = new Map();
  return {
    ACCESSIBLE: {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:
        'AccessibleAfterFirstUnlockThisDeviceOnly',
    },
    setGenericPassword: jest.fn(async (username, password, options = {}) => {
      store.set(options.service ?? 'default', { username, password });
      return { service: options.service, storage: 'mock' };
    }),
    getGenericPassword: jest.fn(async (options = {}) => {
      const item = store.get(options.service ?? 'default');
      return item
        ? { ...item, service: options.service, storage: 'mock' }
        : false;
    }),
    resetGenericPassword: jest.fn(async (options = {}) => {
      store.delete(options.service ?? 'default');
      return true;
    }),
  };
});

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: {
    hide: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockReturnValue(false),
  },
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockReturnValue(false),
  useHideAnimation: jest.fn().mockReturnValue({
    container: {},
    logo: { source: 0 },
    brand: { source: 0 },
  }),
}));

// ไม่มี mock ทางการ: TurboModuleRegistry.getEnforcing('RNCWebViewModule') ทำงานตอน import
// ใช้ View แทนตรง ๆ (ห้ามเรียก React.createElement ใน factory: babel ของ NativeWind
// จะเปลี่ยนเป็นตัวแปรนอก scope ซึ่ง jest.mock ไม่อนุญาต)
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, WebView: View };
});

// FlashList: mock การวัด layout (parent 400x900, item 100x100)
require('@shopify/flash-list/jestSetup');
