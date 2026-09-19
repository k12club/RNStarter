import { rootReducer, type RootState } from '@/store/rootReducer';
import authReducer, {
  type AuthState,
  type AuthUser,
  selectAuthStatus,
  selectCurrentUser,
  selectIsSignedIn,
  selectSessionExpired,
  signedIn,
  signedOut,
  userUpdated,
} from '@/store/slices/authSlice';
import settingsReducer, {
  resetSettings,
  selectLanguage,
  selectThemePreference,
  setLanguage,
  setThemePreference,
  type SettingsState,
} from '@/store/slices/settingsSlice';

const INIT = { type: '@@test/INIT' };

const user: AuthUser = {
  id: 1,
  username: 'emilys',
  email: 'emily.johnson@x.dummyjson.com',
  firstName: 'Emily',
  lastName: 'Johnson',
};

function stateWith(partial: Partial<RootState>): RootState {
  return { ...rootReducer(undefined, INIT), ...partial };
}

describe('authSlice', () => {
  const initial = authReducer(undefined, INIT);

  it('เริ่มต้นเป็น unknown (กำลังอ่าน token)', () => {
    expect(initial).toEqual<AuthState>({
      status: 'unknown',
      user: null,
      sessionExpired: false,
    });
  });

  it('signedIn พร้อม user', () => {
    const state = authReducer(initial, signedIn({ user }));
    expect(state).toEqual({ status: 'signedIn', user, sessionExpired: false });
  });

  it('signedIn ไม่ส่ง user คง user เดิมไว้ (เปิดแอปแล้ว restore session)', () => {
    const withUser = { ...initial, user };
    expect(authReducer(withUser, signedIn({})).user).toBe(user);
    expect(authReducer(withUser, signedIn({ user: null })).user).toBeNull();
  });

  it('signedIn ล้างสถานะ session หมดอายุ', () => {
    const expired = authReducer(initial, signedOut({ expired: true }));
    expect(authReducer(expired, signedIn({ user })).sessionExpired).toBe(false);
  });

  it('userUpdated แทนที่ user', () => {
    const signed = authReducer(initial, signedIn({ user }));
    const updated = { ...user, firstName: 'Em' };
    expect(authReducer(signed, userUpdated(updated)).user).toEqual(updated);
  });

  it('signedOut ล้าง user และตั้ง sessionExpired ตาม payload', () => {
    const signed = authReducer(initial, signedIn({ user }));

    expect(authReducer(signed, signedOut())).toEqual({
      status: 'signedOut',
      user: null,
      sessionExpired: false,
    });
    expect(
      authReducer(signed, signedOut({ expired: true })).sessionExpired,
    ).toBe(true);
    expect(authReducer(signed, signedOut({})).sessionExpired).toBe(false);
  });

  it('selectors', () => {
    const signedInState = stateWith({
      auth: { status: 'signedIn', user, sessionExpired: false },
    });
    expect(selectAuthStatus(signedInState)).toBe('signedIn');
    expect(selectCurrentUser(signedInState)).toBe(user);
    expect(selectIsSignedIn(signedInState)).toBe(true);
    expect(selectSessionExpired(signedInState)).toBe(false);

    const expiredState = stateWith({
      auth: { status: 'signedOut', user: null, sessionExpired: true },
    });
    expect(selectIsSignedIn(expiredState)).toBe(false);
    expect(selectSessionExpired(expiredState)).toBe(true);
    expect(selectIsSignedIn(stateWith({}))).toBe(false);
  });
});

describe('settingsSlice', () => {
  const initial = settingsReducer(undefined, INIT);

  it('เริ่มต้นตามเครื่อง และยังไม่เลือกภาษา', () => {
    expect(initial).toEqual<SettingsState>({
      themePreference: 'system',
      language: null,
    });
  });

  it('setThemePreference', () => {
    expect(
      settingsReducer(initial, setThemePreference('dark')).themePreference,
    ).toBe('dark');
  });

  it('setLanguage', () => {
    expect(settingsReducer(initial, setLanguage('en')).language).toBe('en');
  });

  it('resetSettings กลับเป็นค่าเริ่มต้น', () => {
    const changed = settingsReducer(
      settingsReducer(initial, setThemePreference('light')),
      setLanguage('en'),
    );
    expect(settingsReducer(changed, resetSettings())).toEqual(initial);
  });

  it('selectors', () => {
    const state = stateWith({
      settings: { themePreference: 'dark', language: 'th' },
    });
    expect(selectThemePreference(state)).toBe('dark');
    expect(selectLanguage(state)).toBe('th');
    expect(selectLanguage(stateWith({}))).toBeNull();
  });
});

describe('rootReducer', () => {
  it('รวม auth และ settings', () => {
    expect(Object.keys(rootReducer(undefined, INIT)).sort()).toEqual([
      'auth',
      'settings',
    ]);
  });
});
