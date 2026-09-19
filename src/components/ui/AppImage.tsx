import React, { useState } from 'react';
import {
  type DimensionValue,
  Image,
  type ImageProps,
  type ImageSourcePropType,
  type ImageStyle,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type RadiusToken, useTheme } from '@/theme';

import { Icon } from './Icon';

type A11yProps =
  | {
      /** รูปตกแต่ง ไม่มีความหมาย screen reader จะข้ามไป */
      decorative: true;
      accessibilityLabel?: never;
    }
  | {
      decorative?: false;
      /** จำเป็นเมื่อรูปสื่อความหมาย */
      accessibilityLabel: string;
    };

export type AppImageProps = Omit<
  ImageProps,
  'source' | 'style' | 'accessibilityLabel' | 'alt' | 'accessible'
> &
  A11yProps & {
    /** URL รูป (สะดวกกว่า source สำหรับรูปจาก API) */
    uri?: string | null;
    /** ใช้กับรูปในแอป เช่น require('...') */
    source?: ImageSourcePropType | null;
    /** อัตราส่วนกว้าง / สูง เช่น 16 / 9 */
    aspectRatio?: number;
    /** มุมโค้ง (ค่าเริ่มต้น md) */
    radius?: RadiusToken;
    width?: DimensionValue;
    height?: DimensionValue;
    /** style ของกรอบ */
    style?: StyleProp<ViewStyle>;
    /** style ของตัวรูป */
    imageStyle?: StyleProp<ImageStyle>;
  };

type LoadState = { key: string; status: 'loaded' | 'error' } | null;

function getSourceKey(
  uri: string | null | undefined,
  source: ImageSourcePropType | null | undefined,
) {
  if (uri) {
    return uri;
  }
  if (source === null || source === undefined) {
    return '';
  }
  return typeof source === 'number'
    ? `asset:${source}`
    : JSON.stringify(source);
}

/**
 * รูปภาพพร้อม placeholder (พื้น surfaceAlt + icon รูป) ระหว่างโหลดและเมื่อโหลดไม่ได้
 * รูปที่สื่อความหมายต้องมี accessibilityLabel (บังคับด้วย type) ถ้าเป็นรูปตกแต่งให้ใส่ decorative
 */
export function AppImage({
  uri,
  source,
  aspectRatio,
  radius = 'md',
  width,
  height,
  style,
  imageStyle,
  decorative,
  accessibilityLabel,
  resizeMode = 'cover',
  onLoad,
  onError,
  testID,
  ...rest
}: AppImageProps) {
  const theme = useTheme();
  const [loadState, setLoadState] = useState<LoadState>(null);

  const key = getSourceKey(uri, source);
  const resolvedSource: ImageSourcePropType | null = uri
    ? { uri }
    : source ?? null;
  const status = loadState?.key === key ? loadState.status : 'loading';
  const showImage = !!resolvedSource && status !== 'error';
  const showPlaceholder = status !== 'loaded';

  return (
    <View
      testID={testID}
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityElementsHidden={!!decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      style={[
        styles.frame,
        {
          borderRadius: theme.radius[radius],
          backgroundColor: theme.colors.surfaceAlt,
        },
        aspectRatio ? { aspectRatio } : null,
        width !== undefined ? { width } : null,
        height !== undefined ? { height } : null,
        style,
      ]}
    >
      {showPlaceholder ? (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Icon name="image" size="lg" color="textTertiary" />
        </View>
      ) : null}
      {showImage ? (
        <Image
          {...rest}
          testID={testID ? `${testID}-image` : undefined}
          source={resolvedSource}
          resizeMode={resizeMode}
          accessibilityIgnoresInvertColors
          onLoad={event => {
            setLoadState({ key, status: 'loaded' });
            onLoad?.(event);
          }}
          onError={event => {
            setLoadState({ key, status: 'error' });
            onError?.(event);
          }}
          style={[StyleSheet.absoluteFill, imageStyle]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
