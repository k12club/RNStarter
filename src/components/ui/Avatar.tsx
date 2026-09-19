import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type TextVariant, type Theme, useTheme } from '@/theme';
import { getInitials } from '@/utils/format';

import { Icon, type IconSize } from './Icon';
import { Text } from './Text';

export type AvatarSize = keyof Theme['sizes']['avatar'];
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export type AvatarProps = {
  /** URL รูป ถ้าไม่มีหรือโหลดไม่ได้จะแสดงตัวอักษรย่อจาก name */
  uri?: string | null;
  name?: string | null;
  /** ขนาดจาก theme.sizes.avatar (ค่าเริ่มต้น md = 44) */
  size?: AvatarSize;
  /** จุดสถานะมุมขวาล่าง */
  status?: AvatarStatus;
  /** คำอธิบายสถานะสำหรับ screen reader เช่น "ออนไลน์" */
  statusLabel?: string;
  /** ค่าเริ่มต้นคือ name (+ statusLabel) */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// ตัวอักษรย่อต้องไม่เล็กกว่า 14 จึงเลือก variant ตามขนาดวงกลม (xs ใส่ได้ตัวเดียว)
const INITIALS: Record<
  AvatarSize,
  { variant: TextVariant; max: number; icon: IconSize }
> = {
  xs: { variant: 'caption', max: 1, icon: 'xs' },
  sm: { variant: 'label', max: 2, icon: 'sm' },
  md: { variant: 'title', max: 2, icon: 'md' },
  lg: { variant: 'h3', max: 2, icon: 'lg' },
  xl: { variant: 'h1', max: 2, icon: 'xl' },
};

function getStatusColor(theme: Theme, status: AvatarStatus) {
  switch (status) {
    case 'online':
      return theme.colors.success;
    case 'busy':
      return theme.colors.danger;
    case 'away':
      return theme.colors.warning;
    case 'offline':
    default:
      return theme.colors.textTertiary;
  }
}

/** รูปโปรไฟล์ทรงกลม พร้อมตัวอักษรย่อเมื่อไม่มีรูป / โหลดรูปไม่ได้ */
export function Avatar({
  uri,
  name,
  size = 'md',
  status,
  statusLabel,
  accessibilityLabel,
  style,
  testID,
}: AvatarProps) {
  const theme = useTheme();
  // จำ uri ที่โหลดไม่ได้ / โหลดเสร็จ เมื่อ uri เปลี่ยนจะลองโหลดใหม่เอง
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [loadedUri, setLoadedUri] = useState<string | null>(null);

  const box = theme.sizes.avatar[size];
  const spec = INITIALS[size];
  const initials = getInitials(name, spec.max);
  const showImage = !!uri && failedUri !== uri;
  const showFallback = !showImage || loadedUri !== uri;

  const label =
    accessibilityLabel ??
    ([name?.trim(), statusLabel].filter(Boolean).join(', ') || undefined);

  const dot =
    box >= theme.sizes.avatar.lg
      ? theme.spacing.lg
      : box >= theme.sizes.avatar.md
      ? theme.spacing.md
      : theme.spacing.sm + theme.spacing.xxs;

  return (
    <View
      testID={testID}
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      style={[{ width: box, height: box }, style]}
    >
      <View
        style={[
          styles.circle,
          {
            width: box,
            height: box,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primarySoft,
          },
        ]}
      >
        {showFallback ? (
          initials ? (
            <Text
              variant={spec.variant}
              weight="semibold"
              color="onPrimarySoft"
              numberOfLines={1}
              maxFontSizeMultiplier={1}
            >
              {initials}
            </Text>
          ) : (
            <Icon name="user" size={spec.icon} color="onPrimarySoft" />
          )
        ) : null}
        {showImage ? (
          <Image
            testID={testID ? `${testID}-image` : undefined}
            source={{ uri }}
            accessibilityIgnoresInvertColors
            onLoad={() => setLoadedUri(uri)}
            onError={() => setFailedUri(uri)}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: theme.radius.full },
            ]}
          />
        ) : null}
      </View>
      {status ? (
        <View
          style={[
            styles.status,
            {
              width: dot,
              height: dot,
              borderRadius: theme.radius.full,
              borderWidth: theme.spacing.xxs,
              borderColor: theme.colors.surface,
              backgroundColor: getStatusColor(theme, status),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  status: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
});
