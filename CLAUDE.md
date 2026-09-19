# RNStarter — project instructions

React Native 0.87 CLI starter (not Expo). คำอธิบายเต็ม / คำสั่ง / โครงสร้าง: `README.md`
ก่อนบอกว่าเสร็จ: `npm run verify` (typecheck + lint + test) ต้องผ่าน และถ้าแตะ native ต้อง build ทั้งสองฝั่ง

## commit style

- prefix อังกฤษ (feat/fix/chore/refactor/docs/test) + คำอธิบายภาษาไทย เช่น `feat: เพิ่มหน้าตั้งค่าภาษา`
- pre-commit (husky + lint-staged) รัน eslint --max-warnings=0, prettier, tsc: ถ้า fail ให้แก้ต้นเหตุ

## กติกาที่ config บอกไม่หมด (silent failure)

- ฟอนต์: ห้าม `fontWeight` / `fontStyle` / class `font-bold` / `italic` — Android เปลี่ยนเป็นฟอนต์ระบบแบบเงียบ ๆ เลือกน้ำหนักผ่าน `<Text weight>` / `font-body-bold`
- `<Text>` ของแอปตั้ง font/size/color ผ่าน style เสมอ: className ด้านตัวอักษรบน Text ไม่มีผล (style ชนะ className) ใช้ props
- Pressable ที่ใช้ `style={({ pressed }) => ...}` ต้องมี `cssInterop={false}` (NativeWind v4 ทิ้ง style function บนเครื่องจริง) และ Jest มองไม่เห็นปัญหานี้เพราะ interop ปิดตอน test: งาน UI ต้องดูบน simulator / emulator ด้วยเสมอ
- สี: token จาก `src/theme/colors.ts` เท่านั้น (className: ชื่อใน `src/theme/tailwindColors.js`) ไม่มี palette ของ Tailwind
- ห้ามใช้ `colors.transparent` เป็นสีข้อความ / `selectionColor`: Android (New Arch) ถือว่าสีค่า 0 = ไม่ได้ตั้งสี แล้ววาดข้อความเป็นสีดำ ใช้ `INVISIBLE_TEXT_COLOR` (พื้นหลัง / เส้นขอบใช้ `transparent` ได้)
- ข้อความไทย >= 14 ผ่าน typeScale; ตัวอักษรไทยต้องมี lineHeight ~1.5x ไม่งั้นสระถูกตัด
- i18n: key ใน `locales/th` กับ `locales/en` ต้องตรงกันทุก namespace (มี test); ภาษาไทยมี plural แค่ `_other`; ห้ามใช้ formatter `relativetime`/`list` ของ i18next (Hermes ไม่มี Intl.RelativeTimeFormat) ใช้ `formatRelative()`
- `index.js` บรรทัดแรกต้องเป็น `import 'intl-pluralrules'`
- `handleSubmit(onSubmit)` ส่งเข้า `onPress` ตรง ๆ ไม่ได้: `onPress={() => handleSubmit(onSubmit)()}`
- icon ผ่าน `src/components/ui/icons.ts` เท่านั้น (barrel import ของ lucide = +1.8 MB)
- token เก็บใน Keychain (`tokenStorage`) ห้ามเก็บใน Redux / MMKV; ห้ามส่ง option `cloudSync` ให้ keychain (v10 เปิด iCloud sync ทันทีที่มี key นี้)
- `react-native-device-info`: ห้ามเรียก `isEmulator()` (crash บน Android 15/16)
- deep link ห้ามเปิด WebView ด้วย url จากภายนอก (phishing)

## native / build

- babel: ห้ามเพิ่ม `react-native-worklets/plugin` เอง (`nativewind/babel` ใส่ให้แล้ว ซ้ำ = แปลง worklet สองรอบ)
- แก้ `.env` / `babel.config.js` / `tailwind.config.js` แล้ว Metro ไม่รู้: `npm run start:reset`, jest: `npx jest --clearCache`
- build release อ่าน `.env.production` ทับ `.env` (ไม่มีไฟล์ = ได้ `APP_ENV=development`); แก้ไฟล์ env แล้ว `npm run clean:metro` ก่อน build release
- อัปเกรด reanimated กับ worklets พร้อมกันเป็นคู่ (4.6.x <-> 0.12.x); ห้ามติดตั้ง `@babel/core` โดยไม่ระบุเวอร์ชัน (latest เป็น Babel 8)
- `android/gradle.properties`: คง `newArchEnabled=true`, `android.builtInKotlin=false`, `android.newDsl=false`, ห้ามเปิด configuration-cache
- iOS: SceneDelegate อยู่ใน `AppDelegate.swift` (iOS 27 บังคับ UIScene) — deep link ใหม่ต้องผ่าน `scene(_:openURLContexts:)` ไม่ใช่ `application(_:open:)`
- `patches/` apply ตอน `npm install` (nitro-modules: iOS < 18 crash, css-interop: ImageBackground warning); สร้างใหม่ด้วย `npm run patch:nitro` / `npm run patch:css-interop` (ไม่งั้นไฟล์ build / cache ติดเข้า patch)
- deep link: `getInitialURL` ใน `src/navigation/linking.ts` ตั้ง timeout เอง (ค่าเริ่มต้น 150ms ของ React Navigation ทำลิงก์ตอน cold start หาย)
- `xcode-select` ของเครื่อง palm ชี้ CommandLineTools: รันคำสั่ง iOS ด้วย `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`
- มีหลายเครื่องใน `adb devices`: `run-android` ติดตั้ง / เปิดแอปทุกเครื่อง (ไม่สน `ANDROID_SERIAL`) เครื่องเดียวพัง = ทั้งคำสั่งพัง ใช้ `--device <id>`
- ตรวจ runtime: `maestro --device <id> test maestro/smoke.yaml` (iOS / Android) และอ่าน console ของแอปผ่าน CDP ที่ `http://localhost:8081/json/list` (ต้องส่ง header `Origin: http://localhost:8081`)

## test

- Testing Library v14: `render` / `fireEvent` / `act` เป็น async ต้อง `await`
- component: `renderWithProviders`; หน้าจอ: `renderScreen` (route อื่นเป็น stub แสดง `route:<Name>`)
- native module ใหม่: เพิ่ม mock ใน `jest/setup.js` (ห้ามเรียก `React.createElement` ใน factory ของ `jest.mock`: babel ของ NativeWind แปลงเป็นตัวแปรนอก scope) และถ้าส่ง ESM เพิ่มใน `esmPackages` ของ `jest.config.js`
