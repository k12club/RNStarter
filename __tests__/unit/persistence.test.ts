import { storage } from '@/services/storage/mmkv';
import { createStore } from '@/store';
import {
  clearPersistedState,
  loadPersistedState,
  subscribePersistence,
} from '@/store/persistence';
import { signedIn, signedOut } from '@/store/slices/authSlice';
import {
  resetSettings,
  setThemePreference,
} from '@/store/slices/settingsSlice';

/**
 * MMKV ใน Jest เป็น mock ในหน่วยความจำ (สร้างโดย library เอง)
 * key ของ state ที่บันทึกเป็นค่า private ใน persistence.ts: เปลี่ยนที่นั่นต้องแก้ที่นี่ด้วย
 */
const STORAGE_KEY = 'redux-state';

function writeRaw(value: unknown) {
  storage.set(STORAGE_KEY, JSON.stringify(value));
}

const user = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
};

beforeEach(() => {
  storage.clearAll();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('loadPersistedState', () => {
  it('ยังไม่เคยบันทึก คืน undefined', () => {
    expect(loadPersistedState()).toBeUndefined();
  });

  it('version ไม่ตรง ทิ้งค่าเก่า', () => {
    writeRaw({
      version: 999,
      state: { settings: { themePreference: 'dark' } },
    });
    expect(loadPersistedState()).toBeUndefined();
  });

  it('ไม่มี state / JSON เสีย คืน undefined', () => {
    writeRaw({ version: 1 });
    expect(loadPersistedState()).toBeUndefined();

    storage.set(STORAGE_KEY, '{broken');
    expect(loadPersistedState()).toBeUndefined();
  });

  it('รวมกับ initialState เมื่อ field บางตัวหายไป (เพิ่ม field ใหม่ภายหลัง)', () => {
    writeRaw({ version: 1, state: { settings: { themePreference: 'dark' } } });
    expect(loadPersistedState()).toEqual({
      settings: { themePreference: 'dark', language: null },
    });
  });

  it('โหลดเฉพาะ slice ใน whitelist และข้าม slice ที่ไม่ใช่ object', () => {
    writeRaw({
      version: 1,
      state: { auth: { status: 'signedIn', user }, settings: 'oops' },
    });
    expect(loadPersistedState()).toEqual({});
  });
});

describe('subscribePersistence', () => {
  it('บันทึกแล้วโหลดกลับเข้า store ใหม่ได้ (round-trip)', () => {
    const first = createStore({});
    const unsubscribe = subscribePersistence(first);

    first.dispatch(setThemePreference('dark'));
    first.dispatch(signedIn({ user }));
    unsubscribe();

    const second = createStore(loadPersistedState());
    expect(second.getState().settings).toEqual({
      themePreference: 'dark',
      language: null,
    });
    // auth ไม่ถูก persist: เริ่มจาก initialState เสมอ
    expect(second.getState().auth).toEqual({
      status: 'unknown',
      user: null,
      sessionExpired: false,
    });
  });

  it('createStore() อ่าน state ที่บันทึกไว้เป็นค่าเริ่มต้น', () => {
    writeRaw({
      version: 1,
      state: { settings: { themePreference: 'light', language: 'en' } },
    });
    expect(createStore().getState().settings).toEqual({
      themePreference: 'light',
      language: 'en',
    });
  });

  it('ไม่เขียนเมื่อ slice ที่ไม่ได้ persist เปลี่ยน', () => {
    const store = createStore({});
    const set = jest.spyOn(storage, 'set');
    subscribePersistence(store);

    store.dispatch(signedIn({ user }));
    store.dispatch(signedOut({ expired: true }));
    expect(set).not.toHaveBeenCalled();

    store.dispatch(setThemePreference('dark'));
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    expect(JSON.parse(String(set.mock.calls[0][1]))).toEqual({
      version: 1,
      state: { settings: { themePreference: 'dark', language: null } },
    });
  });

  it('ไม่เขียนซ้ำเมื่อ action ไม่ได้เปลี่ยนค่าจริง', () => {
    const store = createStore({});
    const set = jest.spyOn(storage, 'set');
    subscribePersistence(store);

    store.dispatch(setThemePreference('dark'));
    store.dispatch(setThemePreference('dark'));
    store.dispatch({ type: 'unknown/action' });
    expect(set).toHaveBeenCalledTimes(1);

    store.dispatch(resetSettings());
    expect(set).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe แล้วหยุดเขียน', () => {
    const store = createStore({});
    const set = jest.spyOn(storage, 'set');
    const unsubscribe = subscribePersistence(store);
    unsubscribe();

    store.dispatch(setThemePreference('light'));
    expect(set).not.toHaveBeenCalled();
  });
});

describe('clearPersistedState', () => {
  it('ลบค่าที่บันทึกไว้', () => {
    const store = createStore({});
    subscribePersistence(store);
    store.dispatch(setThemePreference('dark'));
    expect(loadPersistedState()).toBeDefined();

    clearPersistedState();
    expect(loadPersistedState()).toBeUndefined();
  });
});
