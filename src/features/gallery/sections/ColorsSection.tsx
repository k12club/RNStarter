import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { DemoGroup } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import { type ColorTokens, makeStyles, useTheme } from '@/theme';

type ColorToken = keyof ColorTokens;
type ColorGroupKey =
  | 'surfaces'
  | 'text'
  | 'borders'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'other';

const GROUPS: ReadonlyArray<{
  key: Exclude<ColorGroupKey, 'other'>;
  tokens: readonly ColorToken[];
}> = [
  { key: 'surfaces', tokens: ['background', 'surface', 'surfaceAlt'] },
  {
    key: 'text',
    tokens: ['text', 'textSecondary', 'textTertiary', 'textDisabled'],
  },
  { key: 'borders', tokens: ['border', 'borderStrong'] },
  {
    key: 'primary',
    tokens: ['primary', 'onPrimary', 'primarySoft', 'onPrimarySoft'],
  },
  {
    key: 'success',
    tokens: ['success', 'onSuccess', 'successSoft', 'onSuccessSoft'],
  },
  {
    key: 'warning',
    tokens: ['warning', 'onWarning', 'warningSoft', 'onWarningSoft'],
  },
  {
    key: 'danger',
    tokens: ['danger', 'onDanger', 'dangerSoft', 'onDangerSoft'],
  },
  { key: 'info', tokens: ['info', 'onInfo', 'infoSoft', 'onInfoSoft'] },
];

const GROUPED = new Set<ColorToken>(GROUPS.flatMap(group => group.tokens));

const useStyles = makeStyles(theme => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.lg,
  },
  // 2 คอลัมน์: 48% + ช่องว่างที่เหลือ (ชื่อ token ยาวสุด ~17 ตัวอักษรยังพอดีที่ 320dp)
  tile: {
    width: '48%',
    gap: theme.spacing.xxs,
  },
  // เส้นขอบ borderStrong ให้เห็นสีที่ใกล้พื้น card เช่น surface / transparent
  swatch: {
    height: theme.sizes.touchTarget,
    borderRadius: theme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
    marginBottom: theme.spacing.xs,
  },
}));

type SwatchProps = {
  token: ColorToken;
  value: string;
};

/** ช่องสีหนึ่ง token: ข้อความอยู่ใต้ช่องสี (ไม่วางบนสี จะได้อ่านได้ทุก token) */
const Swatch = memo(function SwatchContent({ token, value }: SwatchProps) {
  const styles = useStyles();

  return (
    <View testID={`gallery-swatch-${token}`} style={styles.tile}>
      <View style={[styles.swatch, { backgroundColor: value }]} />
      <Text variant="label">{token}</Text>
      <Text variant="caption" color="textSecondary" selectable>
        {value}
      </Text>
    </View>
  );
});

/** color token ทั้งหมดของธีมปัจจุบัน แบ่งกลุ่มตามหน้าที่ */
export const ColorsSection = memo(function ColorsSectionContent() {
  const { t } = useTranslation('gallery');
  const theme = useTheme();
  const styles = useStyles();
  // token ที่ไม่อยู่ในกลุ่มไหน (เช่น เพิ่มใหม่ภายหลัง) ไปอยู่กลุ่ม "อื่น ๆ" เสมอ ไม่หล่นหาย
  const otherTokens = (Object.keys(theme.colors) as ColorToken[]).filter(
    token => !GROUPED.has(token),
  );
  const groups: ReadonlyArray<{
    key: ColorGroupKey;
    tokens: readonly ColorToken[];
  }> = [...GROUPS, { key: 'other', tokens: otherTokens }];

  return (
    <GallerySection name="colors">
      <Text variant="bodySmall" color="textSecondary">
        {t('colors.current', {
          scheme: theme.isDark
            ? t('controls.themeDark')
            : t('controls.themeLight'),
        })}
      </Text>
      {groups.map(group => (
        <DemoGroup key={group.key} title={t(`colors.groups.${group.key}`)}>
          <View style={styles.grid}>
            {group.tokens.map(token => (
              <Swatch key={token} token={token} value={theme.colors[token]} />
            ))}
          </View>
        </DemoGroup>
      ))}
    </GallerySection>
  );
});
