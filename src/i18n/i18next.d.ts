import 'i18next';

import type { defaultNS, resources } from './resources';

// ทำให้ t('ns:key') ถูกตรวจ type: พิมพ์ key ผิด = compile error
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['th'];
  }
}
