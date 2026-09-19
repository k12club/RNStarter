import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enErrors from './locales/en/errors.json';
import enGallery from './locales/en/gallery.json';
import enHome from './locales/en/home.json';
import enProducts from './locales/en/products.json';
import enProfile from './locales/en/profile.json';
import enSettings from './locales/en/settings.json';
import enValidation from './locales/en/validation.json';
import thAuth from './locales/th/auth.json';
import thCommon from './locales/th/common.json';
import thErrors from './locales/th/errors.json';
import thGallery from './locales/th/gallery.json';
import thHome from './locales/th/home.json';
import thProducts from './locales/th/products.json';
import thProfile from './locales/th/profile.json';
import thSettings from './locales/th/settings.json';
import thValidation from './locales/th/validation.json';

/**
 * แต่ละ namespace = หนึ่งไฟล์ JSON ต่อภาษา
 * เพิ่ม namespace ใหม่: สร้าง locales/th/<ns>.json + locales/en/<ns>.json แล้ว import ที่นี่ทั้งสองภาษา
 *
 * ภาษาไทยเป็นต้นแบบของ type (ดู i18next.d.ts): key ที่มีใน th แต่ไม่มีใน en จะ fallback เป็นไทย
 */
export const defaultNS = 'common';

export const resources = {
  th: {
    common: thCommon,
    errors: thErrors,
    validation: thValidation,
    auth: thAuth,
    home: thHome,
    products: thProducts,
    profile: thProfile,
    settings: thSettings,
    gallery: thGallery,
  },
  en: {
    common: enCommon,
    errors: enErrors,
    validation: enValidation,
    auth: enAuth,
    home: enHome,
    products: enProducts,
    profile: enProfile,
    settings: enSettings,
    gallery: enGallery,
  },
} as const;

export const namespaces = Object.keys(resources.th) as Array<
  keyof (typeof resources)['th']
>;
