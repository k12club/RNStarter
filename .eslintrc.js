module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:import-x/recommended',
    'plugin:import-x/typescript',
  ],
  // lint-staged ส่ง dotfile มาด้วย ถ้าไม่ปลด ignore จะได้ warning "File ignored by default"
  ignorePatterns: ['!.eslintrc.js', '!.prettierrc.js', 'coverage/', 'vendor/'],
  settings: {
    'import-x/resolver-next': [
      require('eslint-import-resolver-typescript').createTypeScriptImportResolver(
        {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      ),
    ],
  },
  rules: {
    // เตือนรูปแบบปกติของ dayjs.extend / i18n.use / NetInfo.addEventListener: เสียงดังเกินประโยชน์
    'import-x/no-named-as-default': 'off',
    'import-x/no-named-as-default-member': 'off',
    // '@env' เป็น virtual module ของ react-native-dotenv
    'import-x/no-unresolved': ['error', { ignore: ['^@env$'] }],
    'import-x/order': [
      'warn',
      {
        'newlines-between': 'always',
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    // ให้ใช้ Text ของแอป (ฟอนต์ไทย + lineHeight) แทน Text ของ react-native
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['Text'],
            message:
              "ใช้ Text จาก '@/components/ui' แทน (ฟอนต์ไทย + lineHeight ที่ถูกต้อง)",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // ตัวห่อ Text ของแอปเองต้อง import Text ของ react-native ได้
      files: ['src/components/ui/Text.tsx'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // ฟอนต์ custom + fontWeight / fontStyle บน Android = ได้ฟอนต์ระบบแทนแบบเงียบ ๆ
      // (หาไฟล์ "<family>_bold.ttf" ไม่เจอ) ให้เลือกน้ำหนักผ่าน fontFamily / <Text weight>
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'Property[key.name=/^font(Weight|Style)$/]',
            message:
              'ห้ามใช้ fontWeight / fontStyle กับฟอนต์ของแอป ใช้ <Text weight="bold"> หรือ fonts.body.bold แทน',
          },
          {
            // NativeWind: class น้ำหนัก / เอียง = fontWeight / fontStyle (ปัญหาเดียวกันบน Android)
            selector:
              'JSXAttribute[name.name=/[cC]lassName$/] Literal[value=/(^|\\s)(font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|italic)(\\s|$)/]',
            message:
              'ห้ามใช้ font-bold / font-semibold / italic ใช้ font-body-bold, font-heading-semibold ฯลฯ แทน (ดู tailwind.config.js)',
          },
          {
            // NativeWind v4 ครอบ Pressable แล้วทิ้ง style ที่เป็น function (nativewind#1105)
            // บนเครื่องจริงปุ่มจะไม่มีพื้นหลัง แต่ใน Jest ไม่เห็นเพราะ interop ปิดตอน test
            selector:
              "JSXOpeningElement:has(JSXAttribute[name.name='style'] > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression)):not(:has(JSXAttribute[name.name='cssInterop']))",
            message:
              'style แบบ function ต้องใส่ cssInterop={false} (NativeWind v4 ทิ้ง style function ของ Pressable บนเครื่องจริง)',
          },
        ],
      },
    },
    {
      // import icon แบบรวมก้อน = bundle ใหญ่ขึ้น ~1.8 MB (Metro ไม่ tree-shake)
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'lucide-react-native',
                message:
                  "import icon ทีละตัวผ่าน src/components/ui/icons.ts (เช่น 'lucide-react-native/icons/house')",
                allowTypeImports: true,
              },
            ],
          },
        ],
      },
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
      rules: {
        // RNTL v14: fireEvent / render / act เป็น async ต้อง await (กฎนี้ยังคิดว่าเป็น sync)
        'testing-library/no-await-sync-events': 'off',
      },
    },
  ],
};
