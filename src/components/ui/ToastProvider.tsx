import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '@/theme';

import { Toast, type ToastOptions, type ToastType } from './Toast';

/** แสดงพร้อมกันได้สูงสุดกี่อัน เกินนี้อันเก่าสุดจะถูกดันออก */
const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  /** เพิ่มทุกครั้งที่มี toast ซ้ำเข้ามา เพื่อเริ่มนับเวลาปิดใหม่ */
  version: number;
};

type ToastShortcutOptions = Omit<ToastOptions, 'type' | 'message'>;

export type ToastApi = {
  /** คืนค่า id สำหรับปิดเองด้วย hide(id) */
  show: (options: ToastOptions) => string;
  success: (message: string, options?: ToastShortcutOptions) => string;
  error: (message: string, options?: ToastShortcutOptions) => string;
  info: (message: string, options?: ToastShortcutOptions) => string;
  warning: (message: string, options?: ToastShortcutOptions) => string;
  hide: (id: string) => void;
  hideAll: () => void;
};

type ToastController = {
  show: (item: ToastItem) => string;
  hide: (id: string) => void;
  hideAll: () => void;
};

// ---------------------------------------------------------------------------
// ตัวกลางระดับโมดูล: ให้เรียก toast.* ได้จากนอก React (React Query onError / API layer)
// ToastProvider ที่ mount ล่าสุดเป็นตัวรับ ถ้ายังไม่มี provider จะพักไว้แล้วแสดงตอน mount
// ---------------------------------------------------------------------------

const controllers: ToastController[] = [];
let pending: ToastItem[] = [];
let nextId = 0;

function createItem(options: ToastOptions): ToastItem {
  nextId += 1;
  return {
    id: `toast-${nextId}`,
    type: options.type ?? 'info',
    title: options.title,
    message: options.message,
    duration: options.duration ?? DEFAULT_DURATION,
    version: 0,
  };
}

function activeController(): ToastController | undefined {
  return controllers[controllers.length - 1];
}

function createApi(getController: () => ToastController | undefined): ToastApi {
  const show = (options: ToastOptions) => {
    const item = createItem(options);
    const controller = getController();
    if (controller) {
      return controller.show(item);
    }
    pending = [...pending, item].slice(-MAX_VISIBLE);
    return item.id;
  };
  const withType =
    (type: ToastType) => (message: string, options?: ToastShortcutOptions) =>
      show({ ...options, type, message });

  return {
    show,
    success: withType('success'),
    error: withType('error'),
    info: withType('info'),
    warning: withType('warning'),
    hide: id => {
      pending = pending.filter(item => item.id !== id);
      getController()?.hide(id);
    },
    hideAll: () => {
      pending = [];
      getController()?.hideAll();
    },
  };
}

/**
 * API แบบเรียกตรง ใช้ได้ทั้งในและนอก component
 *
 * @example
 * toast.error(t('errors:network'));
 * toast.show({ type: 'success', title: 'บันทึกแล้ว', message: '...', duration: 3000 });
 */
export const toast: ToastApi = createApi(activeController);

const ToastContext = createContext<ToastApi | null>(null);

/** ใช้ใน component: ได้ API ของ ToastProvider ที่ครอบอยู่ (ถ้าไม่มีจะใช้ toast ระดับโมดูล) */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? toast;
}

function isSameToast(a: ToastItem, b: ToastItem) {
  return a.type === b.type && a.title === b.title && a.message === b.message;
}

function announce(item: ToastItem) {
  // Android ประกาศผ่าน accessibilityLiveRegion ของ container อยู่แล้ว
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(
      item.title ? `${item.title} ${item.message}` : item.message,
    );
  }
}

/**
 * แสดง toast ใต้ safe-area ด้านบน ซ้อนกันสูงสุด 3 อัน (ใหม่สุดอยู่บน)
 * - toast ที่ข้อความซ้ำกับอันที่แสดงอยู่ จะไม่เพิ่มอันใหม่ แต่เริ่มนับเวลาปิดใหม่
 *   (กัน error เดียวกันจากหลาย query ท่วมจอ)
 * - อยู่ใต้ RN Modal เสมอ (Dialog จะบัง toast) และอยู่ใต้ bottom sheet ถ้า mount ไว้ใน BottomSheetModalProvider
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const itemsRef = useRef<ToastItem[]>([]);

  const commit = useCallback((next: ToastItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const hide = useCallback(
    (id: string) => {
      const next = itemsRef.current.filter(item => item.id !== id);
      if (next.length !== itemsRef.current.length) {
        commit(next);
      }
    },
    [commit],
  );

  const controller = useMemo<ToastController>(
    () => ({
      show: item => {
        const current = itemsRef.current;
        const duplicate = current.find(existing => isSameToast(existing, item));
        if (duplicate) {
          commit(
            current.map(existing =>
              existing.id === duplicate.id
                ? {
                    ...existing,
                    duration: item.duration,
                    version: existing.version + 1,
                  }
                : existing,
            ),
          );
          return duplicate.id;
        }
        commit([item, ...current].slice(0, MAX_VISIBLE));
        announce(item);
        return item.id;
      },
      hide,
      hideAll: () => commit([]),
    }),
    [commit, hide],
  );

  useEffect(() => {
    controllers.push(controller);
    // แสดง toast ที่ถูกเรียกก่อน provider พร้อม
    const queued = pending;
    pending = [];
    queued.forEach(item => controller.show(item));
    return () => {
      const index = controllers.indexOf(controller);
      if (index >= 0) {
        controllers.splice(index, 1);
      }
    };
  }, [controller]);

  const api = useMemo(() => createApi(() => controller), [controller]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost items={items} onDismiss={hide} />
    </ToastContext.Provider>
  );
}

function ToastHost({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.host, { top: insets.top + theme.spacing.sm }]}
    >
      {items.map(item => (
        <Animated.View
          key={item.id}
          entering={FadeInUp.duration(theme.durations.normal)}
          exiting={FadeOutUp.duration(theme.durations.fast)}
          layout={LinearTransition.duration(theme.durations.normal)}
          style={styles.item}
        >
          <ToastRow item={item} onDismiss={onDismiss} />
        </Animated.View>
      ))}
    </View>
  );
}

function ToastRow({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { id, duration, version } = item;

  useEffect(() => {
    if (duration <= 0) {
      return;
    }
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, version, onDismiss]);

  const handleDismiss = useCallback(() => onDismiss(id), [id, onDismiss]);

  return (
    <Toast
      type={item.type}
      title={item.title}
      message={item.message}
      onDismiss={handleDismiss}
    />
  );
}

const useStyles = makeStyles(theme => ({
  host: {
    position: 'absolute',
    left: theme.sizes.screenGutter,
    right: theme.sizes.screenGutter,
    alignItems: 'center',
    // พื้นที่ว่างรอบ toast ต้องกดทะลุไปหาหน้าจอด้านล่างได้
    pointerEvents: 'box-none',
    zIndex: 1000,
    elevation: 1000,
  },
  item: {
    width: '100%',
    maxWidth: theme.sizes.contentMaxWidth,
    marginBottom: theme.spacing.sm,
  },
}));
