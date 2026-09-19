import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  AppImage,
  Badge,
  Button,
  ErrorState,
  Icon,
  ListItem,
  Screen,
  Section,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { useRefreshByUser } from '@/hooks';
import type { RootStackScreenProps } from '@/navigation/types';
import { makeStyles, useResponsive, useTheme } from '@/theme';
import { formatNumber } from '@/utils/format';

import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { useProduct } from '../hooks/useProducts';
import type { Product } from '../types';
import {
  formatCategoryName,
  formatDiscount,
  formatRating,
  formatUsd,
} from '../utils';

/**
 * รายละเอียดสินค้า (root stack, native header แสดง params.title)
 * - มาจากหน้ารายการ: แสดงข้อมูลจาก cache ของรายการทันที (placeholderData) แล้วโหลดข้อมูลล่าสุดเบื้องหลัง
 * - เปิดจาก deep link (rnstarter://products/1) ไม่มี title: ตั้งชื่อ header เมื่อโหลดเสร็จ
 */
export function ProductDetailScreen({
  route,
  navigation,
}: RootStackScreenProps<'ProductDetail'>) {
  const { id, title: paramTitle } = route.params;
  const query = useProduct(id);
  const product = query.data;
  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(query.refetch);

  const loadedTitle = product?.title;
  useEffect(() => {
    if (!paramTitle && loadedTitle) {
      navigation.setOptions({ title: loadedTitle });
    }
  }, [navigation, paramTitle, loadedTitle]);

  if (!product) {
    return (
      <Screen edges={[]}>
        {query.isError ? (
          <ErrorState
            fill
            error={query.error}
            onRetry={() => {
              query.refetch();
            }}
            retrying={query.isFetching}
            testID="product-detail-error"
          />
        ) : (
          <ProductDetailSkeleton />
        )}
      </Screen>
    );
  }

  return (
    <ProductDetailContent
      product={product}
      refreshing={isRefetchingByUser}
      onRefresh={refetchByUser}
    />
  );
}

type ProductDetailContentProps = {
  product: Product;
  refreshing: boolean;
  onRefresh: () => void;
};

function ProductDetailContent({
  product,
  refreshing,
  onRefresh,
}: ProductDetailContentProps) {
  const { t } = useTranslation(['products', 'common']);
  const toast = useToast();
  const styles = useStyles();

  const soldOut =
    product.stock <= 0 || product.availabilityStatus === 'Out of Stock';
  const rating = formatRating(product.rating);
  const heroUri = product.images[0] ?? product.thumbnail;

  const addToCart = () => {
    toast.success(t('addedToCart', { title: product.title }));
  };

  return (
    <Screen
      scroll
      edges={[]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      testID="product-detail"
      footer={
        <Button
          testID="product-add-to-cart"
          title={soldOut ? t('unavailable') : t('addToCart')}
          size="lg"
          fullWidth
          disabled={soldOut}
          onPress={addToCart}
          left={<Icon name="shopping-cart" size="sm" color="onPrimary" />}
        />
      }
    >
      <AppImage
        uri={heroUri}
        aspectRatio={1}
        radius="none"
        accessibilityLabel={product.title}
        testID="product-detail-image"
      />

      <View className="gap-5 px-4 pt-5">
        <View className="gap-1">
          {product.brand ? (
            <Text variant="label" color="textSecondary">
              {product.brand}
            </Text>
          ) : null}
          <Text variant="h2" accessibilityRole="header">
            {product.title}
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center gap-3">
          <Text variant="h1" testID="product-detail-price">
            {formatUsd(product.price)}
          </Text>
          {product.discountPercentage > 0 ? (
            <Badge
              status="primary"
              label={t('discount', {
                percent: formatDiscount(product.discountPercentage),
              })}
              style={styles.centered}
              testID="product-detail-discount"
            />
          ) : null}
        </View>

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
          <View
            className="flex-row items-center gap-1"
            accessible
            accessibilityLabel={t('ratingLabel', { rating })}
          >
            <Icon name="star" size="sm" color="warning" />
            <Text variant="body" weight="semibold">
              {rating}
            </Text>
            <Text variant="body" color="textSecondary">
              / 5
            </Text>
          </View>
          <AvailabilityBadge
            availabilityStatus={product.availabilityStatus}
            style={styles.centered}
            testID="product-detail-availability"
          />
          <Text variant="bodySmall" color="textSecondary">
            {t('stockCount', {
              quantity: formatNumber(product.stock, { decimals: 0 }),
            })}
          </Text>
        </View>

        <Section title={t('descriptionTitle')} gap="sm">
          <Text variant="body">{product.description}</Text>
        </Section>
      </View>

      <Section
        title={t('detailsTitle')}
        headerInset="lg"
        gap="xs"
        style={styles.details}
      >
        <View>
          <ListItem
            left="layout-grid"
            title={t('details.category')}
            value={formatCategoryName(product.category)}
          />
          {product.sku ? (
            <ListItem left="tag" title={t('details.sku')} value={product.sku} />
          ) : null}
          {/* ข้อความยาว ใช้ subtitle (เต็มความกว้าง) แทน value ที่กว้างได้แค่ 45% */}
          {product.warrantyInformation ? (
            <ListItem
              left="shield-check"
              title={t('details.warranty')}
              subtitle={product.warrantyInformation}
            />
          ) : null}
          {product.shippingInformation ? (
            <ListItem
              left="package"
              title={t('details.shipping')}
              subtitle={product.shippingInformation}
            />
          ) : null}
          {product.returnPolicy ? (
            <ListItem
              left="refresh-cw"
              title={t('details.returnPolicy')}
              subtitle={product.returnPolicy}
            />
          ) : null}
        </View>
      </Section>
    </Screen>
  );
}

/** โครงหน้าระหว่างโหลด: รูปสี่เหลี่ยมจัตุรัสเต็มความกว้าง (ไม่เกิน contentMaxWidth) + บรรทัดข้อความ */
function ProductDetailSkeleton() {
  const theme = useTheme();
  const { width } = useResponsive();
  const { t } = useTranslation('common');
  const heroSize = Math.min(width, theme.sizes.contentMaxWidth);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('loading')}
      accessibilityState={{ busy: true }}
      testID="product-detail-loading"
    >
      <Skeleton height={heroSize} radius="none" />
      <View className="gap-4 px-4 pt-5">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" lines={2} lastLineWidth="70%" />
        <Skeleton
          height={theme.typeScale.h1.lineHeight}
          width={theme.sizes.contentMaxWidth / 4}
          radius="sm"
        />
        <Skeleton variant="text" lines={4} lastLineWidth="50%" />
      </View>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  // Badge ตั้ง alignSelf: flex-start ไว้ ในแถวที่จัดกึ่งกลางให้ตรงกับข้อความข้าง ๆ
  centered: {
    alignSelf: 'center',
  },
  details: {
    marginTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
  },
}));
