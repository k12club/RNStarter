const path = require('path');

/**
 * Babel config
 *
 * - เขียนแบบ function (ไม่ใช้ env.production.plugins) เพื่อคุมลำดับ plugin เอง
 * - ลำดับที่ Babel ใช้: plugins ด้านล่างก่อน แล้วค่อย presets จากหลังไปหน้า
 *   (nativewind/babel -> RN preset) worklets plugin ใน nativewind/babel จึงอยู่หลัง plugin ของเราทั้งหมด
 * - แก้ไฟล์นี้หรือ .env แล้วต้องรัน `npm run start:reset` (Metro ไม่รู้ว่าไฟล์นี้เปลี่ยน)
 *
 * @type {import('@babel/core').ConfigFunction}
 */
module.exports = api => {
  // Metro release bundle (dev=false) = 'production', Jest = 'test'
  const isProduction = api.env('production');

  return {
    // nativewind/babel: แปลง className + ใส่ react-native-worklets/plugin (Reanimated 4) ไว้ท้ายสุดให้แล้ว
    // ถ้าวันหนึ่งเอา NativeWind ออก ต้องเพิ่ม 'react-native-worklets/plugin' เป็น plugin ตัวสุดท้ายเอง
    presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
    plugins: [
      // import { API_URL } from '@env'
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: path.join(__dirname, '.env'),
          safe: false,
          allowUndefined: true,
          verbose: false,
          quiet: true,
        },
      ],
      // import { Button } from '@/components/ui' (ต้องตรงกับ paths ใน tsconfig.json)
      [
        'module-resolver',
        {
          cwd: 'packagejson',
          extensions: [
            '.ios.js',
            '.android.js',
            '.native.js',
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.json',
          ],
          alias: { '@': './src' },
        },
      ],
      // zod v4 ใช้ `export * as ns from` ซึ่ง preset ของ RN ไม่แปลงให้ (Metro bundle จะพัง)
      '@babel/plugin-transform-export-namespace-from',
      // ลบ console.log ใน release build แต่เก็บ warn / error ไว้
      ...(isProduction
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
      // ห้ามใส่ 'react-native-worklets/plugin' ซ้ำที่นี่: nativewind/babel ใส่ให้แล้ว (ซ้ำ = แปลง worklet สองรอบ)
    ],
  };
};
