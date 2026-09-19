import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppImage, Divider, Icon, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

import type { Product } from '../types';
import { formatCategoryName, formatRating, formatUsd } from '../utils';

import { AvailabilityBadge, useAvailability } from './AvailabilityBadge';

/** ขนาดรูปย่อ (dp) ใช้คำนวณระยะเส้นคั่นด้วย */
export const PRODUCT_THUMB_SIZE = 72;

type ProductCardProps = {
  product: Product;
  /** ส่ง product กลับมา ผู้เรียกจึงส่งฟังก์ชันเดียวให้ทุกแถวได้ (memo ไม่แตก) */
  onPress: (product: Product) => void;
};

/**
 * แถวสินค้าในรายการ: รูป 72x72, ชื่อ (ไม่เกิน 2 บรรทัด), ยี่ห้อ / หมวด, ราคา, คะแนน, สถานะสินค้า
 * ทั้งแถวเป็นปุ่มเดียว screen reader อ่านข้อมูลทั้งหมดรวดเดียว
 */
function ProductCardComponent({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation('products');
  const styles = useStyles();
  const availability = useAvailability(product.availabilityStatus);

  const price = formatUsd(product.price);
  const rating = formatRating(product.rating);
  const meta = [product.brand, formatCategoryName(product.category)]
    .filter(Boolean)
    .join(' · ');

  const handlePress = useCallback(() => onPress(product), [onPress, product]);

  return (
    <Pressable
      cssInterop={false}
      testID={`product-item-${product.id}`}
      accessibilityRole="button"
      accessibilityLabel={[
        product.title,
        meta,
        price,
        t('ratingLabel', { rating }),
        availability.label,
      ].join(', ')}
      accessibilityHint={t('openDetailHint')}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <AppImage
        uri={product.thumbnail}
        decorative
        width={PRODUCT_THUMB_SIZE}
        height={PRODUCT_THUMB_SIZE}
        radius="md"
      />
      <View className="flex-1 gap-1">
        <Text variant="body" weight="medium" numberOfLines={2}>
          {product.title}
        </Text>
        {meta ? (
          <Text variant="bodySmall" color="textSecondary">
            {meta}
          </Text>
        ) : null}
        {/* จอแคบ (320) badge ขึ้นบรรทัดใหม่เอง ไม่ถูกตัด */}
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text variant="title">{price}</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="star" size="xs" color="warning" />
            <Text variant="bodySmall" color="textSecondary">
              {rating}
            </Text>
          </View>
          <AvailabilityBadge
            availabilityStatus={product.availabilityStatus}
            size="sm"
            style={styles.badge}
          />
        </View>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardComponent);

/** เส้นคั่นระหว่างแถว เว้นซ้ายให้ตรงกับข้อความ (ไม่ขีดใต้รูป) */
export function ProductSeparator() {
  const theme = useTheme();
  return (
    <Divider
      inset={theme.sizes.screenGutter + PRODUCT_THUMB_SIZE + theme.spacing.md}
    />
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    minHeight: theme.sizes.touchTarget,
    paddingHorizontal: theme.sizes.screenGutter,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  pressed: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  // Badge ตั้ง alignSelf: flex-start ไว้ ในแถวนี้ให้อยู่กึ่งกลางแนวตั้งเท่ากับราคา
  badge: {
    alignSelf: 'center',
  },
}));
