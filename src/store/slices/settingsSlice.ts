import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AppLanguage } from '@/i18n/languages';
import type { ThemePreference } from '@/theme/types';

import type { RootState } from '../rootReducer';

export type SettingsState = {
  themePreference: ThemePreference;
  /** null = ยังไม่เคยเลือก ใช้ภาษาของเครื่อง (fallback เป็นไทย) */
  language: AppLanguage | null;
};

const initialState: SettingsState = {
  themePreference: 'system',
  language: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemePreference(state, action: PayloadAction<ThemePreference>) {
      state.themePreference = action.payload;
    },
    setLanguage(state, action: PayloadAction<AppLanguage>) {
      state.language = action.payload;
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const { setThemePreference, setLanguage, resetSettings } =
  settingsSlice.actions;

export const selectThemePreference = (state: RootState) =>
  state.settings.themePreference;
export const selectLanguage = (state: RootState) => state.settings.language;

export default settingsSlice.reducer;
