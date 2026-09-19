/**
 * Jest 29 + @react-native/jest-preset 0.87 + Testing Library v14
 *
 * - อยู่กับ Jest 29 ไปก่อน: preset ของ RN 0.87 ผูกกับ babel-jest / jest-environment-node 29
 * - แก้ .env / babel.config.js แล้วต้องรัน `npx jest --clearCache` (cache ของ babel-jest ไม่รู้ว่าไฟล์เปลี่ยน)
 *
 * @type {import('jest').Config}
 */

// แพ็กเกจที่ส่งโค้ด ESM มาและต้องให้ babel แปลง
// ต้องรวมเป็น regex เดียว: ถ้าแยกหลายบรรทัด negative lookahead แต่ละอันจะหักล้างกันเอง
const esmPackages = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'react-native-.*',
  '@react-navigation',
  '@gorhom',
  '@shopify/flash-list',
  'lucide-react-native',
  'nativewind',
  'react-redux',
  'immer',
];

module.exports = {
  preset: '@react-native/jest-preset',
  resolver: '<rootDir>/jest/reanimatedResolver.js',
  setupFiles: ['react-native-gesture-handler/jestSetup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest/setup.js'],
  transform: {
    // lucide-react-native ส่งไฟล์ .mjs มาผ่าน export condition 'react-native'
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp|ttf|otf)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  transformIgnorePatterns: [`node_modules/(?!(${esmPackages.join('|')})/)`],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/styleMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/vendor/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/assets/**',
  ],
};
