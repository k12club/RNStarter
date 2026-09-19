/**
 * Jest resolver
 *
 * Reanimated 4.6 ไม่มี jest/resolver.js ในแพ็กเกจ (มีตั้งแต่ 4.7) จึงคัดลอกมาจาก
 * react-native-reanimated@4.7.0/jest/resolver.js (PR #10377) แล้วต่อเข้ากับ resolver ของ RN preset
 * - ส่ง worklets / reanimated ไปใช้ implementation ฝั่ง JS (web) ภายใต้ Jest
 * - resolver ของ RN preset ลบ `exports` ของแพ็กเกจ react-native เพื่อให้ mock subpath ได้
 *
 * อัปเกรดเป็น reanimated 4.7+ แล้ว: ลบไฟล์นี้ และใน jest.config.js ใช้
 *   resolver: 'react-native-reanimated/jest/resolver'
 */
const rnPresetResolver = require('@react-native/jest-preset/jest/resolver');
const workletsResolver = require('react-native-worklets/jest/resolver');

const WEB_ONLY_IN_JEST = new Set([
  'initializers',
  'mutables',
  'mappers',
  'ConfigHelper',
  'UpdateLayoutAnimations',
  'useAnimatedRef',
  'useAnimatedStyle',
  'WorkletEventHandler',
  'JSPropsUpdater',
  'updateProps',
  'util',
  'css/component/AnimatedComponent',
]);

/** @type {import('jest-resolve').SyncResolver} */
module.exports = (request, options) => {
  const { defaultResolver } = options;
  const chainedOptions = {
    ...options,
    defaultResolver: (req, opts) =>
      rnPresetResolver(req, { ...opts, defaultResolver }),
  };

  const basename = request.split('/').pop();
  const isWebOnly = [...WEB_ONLY_IN_JEST].some(entry =>
    entry.includes('/') ? request.endsWith(entry) : basename === entry,
  );
  if (
    request.startsWith('.') &&
    isWebOnly &&
    options.basedir.includes('react-native-reanimated')
  ) {
    return chainedOptions.defaultResolver(request, {
      ...chainedOptions,
      extensions: options.extensions?.filter(ext => !ext.includes('native')),
    });
  }

  return workletsResolver(request, chainedOptions);
};
