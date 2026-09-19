import { jsonStorage } from '@/services/storage/mmkv';

import { rootReducer, type RootState } from './rootReducer';

/**
 * บันทึก state บางส่วนของ Redux ลง MMKV และโหลดกลับตอนเปิดแอป
 *
 * ทำไมไม่ใช้ redux-persist: MMKV อ่านแบบ sync ได้ จึงโหลด state ได้ก่อนสร้าง store
 * ไม่ต้องมี PersistGate / ไม่มีจอกระพริบ / i18n รู้ภาษาที่เลือกไว้ตั้งแต่ render แรก
 * และตัด dependency ที่ไม่ได้อัปเดตตั้งแต่ปี 2019 ออก
 *
 * - เพิ่ม slice ที่ต้องจำ: ใส่ชื่อใน PERSIST_WHITELIST
 * - เปลี่ยนโครงสร้างของ slice ที่ persist แบบไม่เข้ากันกับของเดิม: เพิ่ม PERSIST_VERSION
 *   (ค่าเก่าจะถูกทิ้ง และใช้ initialState แทน)
 * - อย่า persist ข้อมูลจาก server (ใช้ React Query) และอย่า persist token (ใช้ Keychain)
 */
export const PERSIST_WHITELIST = ['settings'] as const;
const PERSIST_VERSION = 1;
const STORAGE_KEY = 'redux-state';

type PersistedKey = (typeof PERSIST_WHITELIST)[number];
type PersistedState = Pick<RootState, PersistedKey>;
type StoredPayload = { version: number; state: Partial<PersistedState> };

export function loadPersistedState(): Partial<RootState> | undefined {
  const payload = jsonStorage.get<StoredPayload>(STORAGE_KEY);
  if (!payload || payload.version !== PERSIST_VERSION || !payload.state) {
    return undefined;
  }

  // รวมกับ initialState เพื่อให้ field ใหม่ที่เพิ่มภายหลังมีค่าเริ่มต้นเสมอ
  const initial = rootReducer(undefined, { type: '@@persistence/INIT' });
  const result: Partial<RootState> = {};
  for (const key of PERSIST_WHITELIST) {
    const saved = payload.state[key];
    if (saved && typeof saved === 'object') {
      result[key] = { ...initial[key], ...saved };
    }
  }
  return result;
}

function pickPersisted(state: RootState): PersistedState {
  const picked = {} as PersistedState;
  for (const key of PERSIST_WHITELIST) {
    picked[key] = state[key];
  }
  return picked;
}

/**
 * subscribe store แล้วเขียนลง MMKV เฉพาะตอน slice ใน whitelist เปลี่ยน
 * (เทียบ reference ของ slice จึงไม่เขียนซ้ำทุก action)
 */
export function subscribePersistence(store: {
  getState: () => RootState;
  subscribe: (listener: () => void) => () => void;
}) {
  let last = pickPersisted(store.getState());

  return store.subscribe(() => {
    const next = pickPersisted(store.getState());
    const changed = PERSIST_WHITELIST.some(key => next[key] !== last[key]);
    if (!changed) {
      return;
    }
    last = next;
    const payload: StoredPayload = { version: PERSIST_VERSION, state: next };
    jsonStorage.set(STORAGE_KEY, payload);
  });
}

export function clearPersistedState() {
  jsonStorage.remove(STORAGE_KEY);
}
