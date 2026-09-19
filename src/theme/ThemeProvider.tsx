import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  Appearance,
  type ImageStyle,
  StyleSheet,
  type TextStyle,
  useColorScheme,
  type ViewStyle,
} from 'react-native';

import { darkColors, lightColors } from './colors';
import { getShadows } from './shadows';
import { durations, radius, sizes, spacing } from './spacing';
import type { ColorScheme, ThemePreference } from './types';
import { fonts, typeScale } from './typography';

function buildTheme(scheme: ColorScheme) {
  return {
    scheme,
    isDark: scheme === 'dark',
    colors: scheme === 'dark' ? darkColors : lightColors,
    shadows: getShadows(scheme),
    spacing,
    radius,
    sizes,
    durations,
    fonts,
    typeScale,
  };
}

export type Theme = ReturnType<typeof buildTheme>;

const lightTheme = buildTheme('light');
const darkTheme = buildTheme('dark');

const ThemeContext = createContext<Theme>(lightTheme);

type ThemeProviderProps = {
  /** 'system' = ตามการตั้งค่าของเครื่อง */
  preference?: ThemePreference;
  children: React.ReactNode;
};

export function ThemeProvider({
  preference = 'system',
  children,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();

  // บังคับ scheme ระดับแอป เพื่อให้ native UI (Alert, keyboard, date picker) เปลี่ยนตามด้วย
  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
  }, [preference]);

  const scheme: ColorScheme =
    preference === 'system' ? systemScheme ?? 'light' : preference;

  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * สร้าง hook สำหรับ style ที่ขึ้นกับ theme
 *
 * @example
 * const useStyles = makeStyles(theme => ({
 *   container: { backgroundColor: theme.colors.background },
 * }));
 *
 * function Screen() {
 *   const styles = useStyles();
 *   return <View style={styles.container} />;
 * }
 */
type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function makeStyles<T extends NamedStyles>(
  factory: (theme: Theme) => T,
) {
  const cache = new WeakMap<Theme, T>();
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => {
      const cached = cache.get(theme);
      if (cached) {
        return cached;
      }
      const styles = StyleSheet.create(factory(theme));
      cache.set(theme, styles);
      return styles;
    }, [theme]);
  };
}
