import i18next from 'i18next';
import { findBestLanguageTag } from 'react-native-localize';

import { resolveInitialLanguage, type AppLanguage } from '@/i18n';
import { namespaces, resources } from '@/i18n/resources';

/** แปลง object ซ้อนเป็น { "a.b.c": value } */
function flatten(value: unknown, prefix = ''): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { [prefix]: value };
  }
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
  }
  return out;
}

/** key ที่ตัด suffix ของ plural ออก (ไทยมีแค่ _other ส่วนอังกฤษมี _one / _other) */
function baseKeys(value: unknown): string[] {
  const keys = Object.keys(flatten(value))
    .filter(Boolean)
    .map(key => key.replace(/_(zero|one|two|few|many|other)$/, ''));
  return [...new Set(keys)].sort();
}

describe('ไฟล์แปลภาษา', () => {
  it('th และ en มี namespace ชุดเดียวกัน', () => {
    expect(Object.keys(resources.en).sort()).toEqual(
      Object.keys(resources.th).sort(),
    );
    expect([...namespaces].sort()).toEqual(Object.keys(resources.th).sort());
  });

  it.each(namespaces)('%s: key ของ th และ en ตรงกันทุกระดับ', ns => {
    const th = baseKeys(resources.th[ns]);
    const en = baseKeys(resources.en[ns]);
    // แยกสองฝั่ง เวลาพังจะเห็นทันทีว่าขาด key ไหนในภาษาไหน
    expect({ missingInEn: th.filter(k => !en.includes(k)) }).toEqual({
      missingInEn: [],
    });
    expect({ missingInTh: en.filter(k => !th.includes(k)) }).toEqual({
      missingInTh: [],
    });
  });

  it.each(namespaces)('%s: ทุกข้อความเป็น string ที่ไม่ว่าง', ns => {
    for (const lang of ['th', 'en'] as const) {
      const entries = Object.entries(flatten(resources[lang][ns])).filter(
        ([key]) => key !== '',
      );
      const invalid = entries
        .filter(([, value]) => typeof value !== 'string' || value.length === 0)
        .map(([key]) => `${lang}:${ns}:${key}`);
      expect(invalid).toEqual([]);
    }
  });

  it('ไทยไม่มี plural รูป _one (ภาษาไทยมีแค่ _other)', () => {
    const thKeys = namespaces.flatMap(ns =>
      Object.keys(flatten(resources.th[ns])),
    );
    expect(thKeys.filter(k => /_one$/.test(k))).toEqual([]);
  });
});

describe('resolveInitialLanguage', () => {
  const mockedFind = jest.mocked(findBestLanguageTag);

  afterEach(() => {
    // คืนค่า mock ใน jest/setup.js (เครื่องเป็นภาษาไทย)
    mockedFind.mockReturnValue({ languageTag: 'th', isRTL: false });
  });

  it('ค่าเริ่มต้น: ยังไม่เลือกภาษา = ไทยเสมอ แม้เครื่องเป็นภาษาอังกฤษ', () => {
    mockedFind.mockReturnValue({ languageTag: 'en', isRTL: false });
    expect(resolveInitialLanguage(null)).toBe('th');
    expect(resolveInitialLanguage(undefined)).toBe('th');
    expect(resolveInitialLanguage('en')).toBe('en');
  });

  it('ภาษาที่ผู้ใช้เลือกไว้มาก่อนภาษาเครื่อง', () => {
    mockedFind.mockReturnValue({ languageTag: 'th', isRTL: false });
    expect(resolveInitialLanguage('en')).toBe('en');
    expect(resolveInitialLanguage('th')).toBe('th');
  });

  it('followDevice: ยังไม่เลือก ใช้ภาษาของเครื่อง', () => {
    expect(resolveInitialLanguage(null, { followDevice: true })).toBe('th');

    mockedFind.mockReturnValue({ languageTag: 'en', isRTL: false });
    expect(resolveInitialLanguage(null, { followDevice: true })).toBe('en');
    expect(resolveInitialLanguage(undefined, { followDevice: true })).toBe(
      'en',
    );
  });

  it('ภาษาเครื่องแบบมี region (en-US) ใช้ได้', () => {
    mockedFind.mockReturnValue({ languageTag: 'en-US', isRTL: false });
    expect(resolveInitialLanguage(null, { followDevice: true })).toBe('en');
  });

  it('เครื่องใช้ภาษาที่ไม่รองรับ: ใช้ไทย', () => {
    mockedFind.mockReturnValue(undefined);
    expect(resolveInitialLanguage(null, { followDevice: true })).toBe('th');
  });

  it('ค่าที่บันทึกไว้ไม่ใช่ภาษาที่รองรับ: ข้ามไปใช้ภาษาเครื่อง', () => {
    mockedFind.mockReturnValue({ languageTag: 'en', isRTL: false });
    expect(
      resolveInitialLanguage('fr' as AppLanguage, { followDevice: true }),
    ).toBe('en');
  });
});

describe('plural (intl-pluralrules)', () => {
  const pluralResources = {
    th: { test: { item_other: '{{count}} ชิ้น' } },
    en: { test: { item_one: '{{count}} item', item_other: '{{count}} items' } },
  };

  type Translate = (key: string, options: { count: number }) => string;

  /** instance แยกจากของแอป ใช้ key ชุดทดสอบ (t ของแอปถูกผูก type กับ key จริง จึง cast) */
  async function createTranslate(lng: AppLanguage): Promise<Translate> {
    const instance = i18next.createInstance();
    await instance.init({
      lng,
      fallbackLng: 'th',
      ns: ['test'],
      defaultNS: 'test',
      resources: pluralResources,
      interpolation: { escapeValue: false },
    });
    return instance.t.bind(instance) as unknown as Translate;
  }

  it('ไม่มี Intl.PluralRules (แบบ Hermes) แล้ว import polyfill: count ของไทยและอังกฤษถูกต้อง', async () => {
    const intl = Intl as { PluralRules?: typeof Intl.PluralRules };
    const native = intl.PluralRules;
    try {
      delete intl.PluralRules;
      jest.isolateModules(() => {
        // ตรงกับบรรทัดแรกของ index.js
        require('intl-pluralrules');
      });
      expect(intl.PluralRules).toBeDefined();
      expect(intl.PluralRules).not.toBe(native);

      expect(new Intl.PluralRules('th').select(1)).toBe('other');
      expect(new Intl.PluralRules('en').select(1)).toBe('one');

      const th = await createTranslate('th');
      expect(th('item', { count: 1 })).toBe('1 ชิ้น');
      expect(th('item', { count: 5 })).toBe('5 ชิ้น');

      const en = await createTranslate('en');
      expect(en('item', { count: 1 })).toBe('1 item');
      expect(en('item', { count: 5 })).toBe('5 items');
    } finally {
      intl.PluralRules = native;
    }
  });
});
