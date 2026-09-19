import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  OfflineBanner,
  Screen,
  SearchBar,
  SkeletonList,
  Spinner,
  Text,
} from '@/components/ui';
import { useDebounce, useRefreshByUser } from '@/hooks';
import type { MainTabScreenProps } from '@/navigation/types';
import { useTheme } from '@/theme';
import { formatNumber } from '@/utils/format';

import { ProductCard, ProductSeparator } from '../components/ProductCard';
import { useCategories, useProductList } from '../hooks/useProducts';
import type { Product } from '../types';

const SEARCH_DEBOUNCE_MS = 400;
const SKELETON_ROWS = 8;

const keyExtractor = (item: Product) => String(item.id);

/**
 * รายการสินค้า (แท็บ): ค้นหา + กรองหมวด + โหลดทีละหน้าเมื่อเลื่อนถึงท้าย
 * - DummyJSON ค้นหาพร้อมกรองหมวดไม่ได้: ระหว่างค้นหาจะไม่มี chip หมวดถูกเลือก (ค้นจากทุกหมวด)
 *   ล้างคำค้นหาแล้วกลับไปหมวดเดิม / กด chip หมวดจะล้างคำค้นหาให้
 * - พิมพ์ค้นหารอ 400ms (debounce) แต่ล้างช่องค้นหาแล้วแสดงผลทันที
 */
export function ProductListScreen({
  navigation,
}: MainTabScreenProps<'Products'>) {
  const { t } = useTranslation(['products', 'common']);
  const theme = useTheme();
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState<string | undefined>();

  const trimmed = searchText.trim();
  const debouncedSearch = useDebounce(trimmed, SEARCH_DEBOUNCE_MS);
  const search = trimmed ? debouncedSearch : '';

  const list = useProductList({ search, category });
  const categories = useCategories();
  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(list.refetch);

  const products = list.data?.products;
  const total = list.data?.total ?? 0;
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = list;

  const openProduct = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', {
        id: product.id,
        title: product.title,
      });
    },
    [navigation],
  );

  const renderItem = useCallback<ListRenderItem<Product>>(
    ({ item }) => <ProductCard product={item} onPress={openProduct} />,
    [openProduct],
  );

  const loadMore = useCallback(() => {
    // หน้าถัดไปโหลดไม่สำเร็จ: รอผู้ใช้กดลองใหม่ ไม่ยิงซ้ำเองทุกครั้งที่ list เปลี่ยนขนาด
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  const selectCategory = useCallback((slug?: string) => {
    setCategory(slug);
    setSearchText('');
  }, []);

  const renderBody = () => {
    if (list.isPending) {
      return (
        <SkeletonList
          count={SKELETON_ROWS}
          lines={3}
          testID="products-loading"
        />
      );
    }
    if (!products) {
      return (
        <ErrorState
          fill
          error={list.error}
          onRetry={() => {
            list.refetch();
          }}
          retrying={list.isFetching}
          testID="products-error"
        />
      );
    }

    const empty = search ? (
      <EmptyState
        icon="search"
        title={t('noResultsTitle')}
        description={t('noResultsDescription', { query: search })}
        actionLabel={t('clearSearch')}
        actionVariant="outline"
        onAction={() => setSearchText('')}
        testID="products-empty"
      />
    ) : (
      <EmptyState
        icon="package"
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        testID="products-empty"
      />
    );

    let footer: React.ReactElement | null = null;
    if (isFetchingNextPage) {
      footer = <Spinner size="small" testID="products-loading-more" />;
    } else if (isFetchNextPageError) {
      footer = (
        <View className="items-center gap-2 px-4 py-4">
          <Text variant="bodySmall" color="textSecondary" align="center">
            {t('loadMoreFailed')}
          </Text>
          <Button
            title={t('common:retry')}
            variant="outline"
            size="sm"
            onPress={() => {
              fetchNextPage();
            }}
            testID="products-load-more-retry"
          />
        </View>
      );
    } else if (!hasNextPage && products.length > 0) {
      footer = (
        <View className="px-4 py-6">
          <Text variant="bodySmall" color="textTertiary" align="center">
            {t('endOfList')}
          </Text>
        </View>
      );
    }

    return (
      <FlashList
        testID="products-list"
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ProductSeparator}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      />
    );
  };

  return (
    <Screen edges={[]}>
      <OfflineBanner />
      <View className="px-4 pb-2 pt-3">
        <SearchBar
          testID="products-search"
          value={searchText}
          onChangeText={setSearchText}
          placeholder={t('searchPlaceholder')}
          accessibilityLabel={t('searchLabel')}
        />
      </View>
      {/* py-1: chip สูง 36 + hitSlop 4 บนล่าง = 44 ต้องอยู่ในกรอบของ ScrollView ถึงจะกดโดน */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel={t('categoriesLabel')}
        className="grow-0"
        contentContainerClassName="gap-2 px-4 py-1"
      >
        <Chip
          testID="products-category-all"
          label={t('allCategories')}
          selected={!search && !category}
          onPress={() => selectCategory(undefined)}
        />
        {categories.data?.map(item => (
          <Chip
            key={item.slug}
            testID={`products-category-${item.slug}`}
            label={item.name}
            selected={!search && category === item.slug}
            onPress={() => selectCategory(item.slug)}
          />
        ))}
      </ScrollView>
      {products && products.length > 0 ? (
        <View className="px-4 pb-1 pt-2">
          <Text
            variant="bodySmall"
            color="textSecondary"
            accessibilityLiveRegion="polite"
            testID="products-result-count"
          >
            {t(search ? 'searchResultCount' : 'resultCount', {
              total: formatNumber(total, { decimals: 0 }),
            })}
          </Text>
        </View>
      ) : null}
      <View className="flex-1">{renderBody()}</View>
    </Screen>
  );
}
