import * as Keychain from 'react-native-keychain';

import { type AuthTokens, tokenStorage } from '@/services/auth/tokenStorage';

/** Keychain ถูก mock เป็น Map ในหน่วยความจำ (jest/setup.js) ใช้ร่วมกันทั้งไฟล์ */

const SERVICE = 'app.auth.tokens';
const TOKENS: AuthTokens = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
};

beforeEach(async () => {
  await tokenStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('tokenStorage', () => {
  it('ยังไม่เคย login: load คืน null', async () => {
    await expect(tokenStorage.load()).resolves.toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });

  it('save แล้วอ่านแบบ sync ได้ทันที และเก็บใน Keychain เป็น JSON', async () => {
    await tokenStorage.save(TOKENS);

    expect(tokenStorage.get()).toEqual(TOKENS);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'tokens',
      JSON.stringify(TOKENS),
      expect.objectContaining({
        service: SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      }),
    );
  });

  it('save ล้มครั้งแรก (errSecDuplicateItem บน iOS): ลบของเดิมแล้วเขียนใหม่ครั้งเดียว', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest
      .mocked(Keychain.setGenericPassword)
      .mockRejectedValueOnce(new Error('errSecDuplicateItem'));

    await tokenStorage.save(TOKENS);

    expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(2);
    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: SERVICE,
    });
    expect(warn).toHaveBeenCalled();
    await expect(tokenStorage.load()).resolves.toEqual(TOKENS);
  });

  it('load อ่านค่าจาก Keychain กลับเข้า cache', async () => {
    await Keychain.setGenericPassword('tokens', JSON.stringify(TOKENS), {
      service: SERVICE,
    });

    await expect(tokenStorage.load()).resolves.toEqual(TOKENS);
    expect(tokenStorage.get()).toEqual(TOKENS);
  });

  it('clear ล้างทั้ง cache และ Keychain', async () => {
    await tokenStorage.save(TOKENS);
    await tokenStorage.clear();

    expect(tokenStorage.get()).toBeNull();
    await expect(tokenStorage.load()).resolves.toBeNull();
  });

  it('JSON เสีย: load คืน null และ log warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await tokenStorage.save(TOKENS);
    await Keychain.setGenericPassword('tokens', '{not-json', {
      service: SERVICE,
    });

    await expect(tokenStorage.load()).resolves.toBeNull();
    expect(tokenStorage.get()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('JSON ผิดรูปแบบ: load คืน null', async () => {
    await Keychain.setGenericPassword(
      'tokens',
      JSON.stringify({ accessToken: 'a', refreshToken: 1 }),
      { service: SERVICE },
    );
    await expect(tokenStorage.load()).resolves.toBeNull();

    await Keychain.setGenericPassword('tokens', 'null', { service: SERVICE });
    await expect(tokenStorage.load()).resolves.toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });

  it('Keychain อ่านไม่ได้: ถือว่ายังไม่ login', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await tokenStorage.save(TOKENS);
    jest
      .mocked(Keychain.getGenericPassword)
      .mockRejectedValueOnce(new Error('keystore unavailable'));

    await expect(tokenStorage.load()).resolves.toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });

  it('Keychain ลบไม่ได้: clear ไม่ throw และ cache ถูกล้าง', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await tokenStorage.save(TOKENS);
    jest
      .mocked(Keychain.resetGenericPassword)
      .mockRejectedValueOnce(new Error('keystore unavailable'));

    await expect(tokenStorage.clear()).resolves.toBeUndefined();
    expect(tokenStorage.get()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});
