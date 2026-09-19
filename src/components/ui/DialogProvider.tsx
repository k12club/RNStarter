import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Dialog, type DialogAction } from './Dialog';

/** กันค้าง: ถ้า onDismiss ของ Modal ไม่มา (เช่น Modal ไม่ได้ present จริง) ให้แสดงอันถัดไปได้หลังเวลานี้ */
const DISMISS_FALLBACK_MS = 1000;

export type AlertOptions = {
  title: string;
  message?: string;
  /** ค่าเริ่มต้น t('common:ok') */
  okLabel?: string;
  /** แตะฉากหลังเพื่อปิดได้ (ค่าเริ่มต้น true) */
  dismissible?: boolean;
};

export type ConfirmOptions = {
  title: string;
  message?: string;
  /** ค่าเริ่มต้น t('common:confirm') */
  confirmLabel?: string;
  /** ค่าเริ่มต้น t('common:cancel') */
  cancelLabel?: string;
  /** การกระทำที่ย้อนกลับไม่ได้ เช่น ลบ: ปุ่มยืนยันเป็นสี danger */
  destructive?: boolean;
  /** แตะฉากหลัง = ยกเลิก (ค่าเริ่มต้น true) */
  dismissible?: boolean;
};

export type DialogApi = {
  /** resolve เมื่อผู้ใช้ปิด dialog (ทุกทาง) */
  alert: (options: AlertOptions) => Promise<void>;
  /** true = กดยืนยัน, false = ยกเลิก / back / แตะฉากหลัง */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

type DialogRequest =
  | { kind: 'alert'; options: AlertOptions; resolve: (value: boolean) => void }
  | {
      kind: 'confirm';
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    };

const DialogContext = createContext<DialogApi | null>(null);

/**
 * dialog แบบ promise
 *
 * @example
 * const dialog = useDialog();
 * const ok = await dialog.confirm({ title: 'ลบรายการนี้?', destructive: true });
 * if (ok) remove();
 */
export function useDialog(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) {
    throw new Error('useDialog must be used inside DialogProvider');
  }
  return api;
}

/** resolve ได้ครั้งเดียว กันกดปุ่มซ้ำ / back ซ้อนกับปุ่ม */
function once(fn: (value: boolean) => void) {
  let called = false;
  return (value: boolean) => {
    if (!called) {
      called = true;
      fn(value);
    }
  };
}

/**
 * แสดง dialog ทีละอันตามลำดับที่เรียก (เรียกซ้อนกันได้ อันถัดไปจะรอคิว)
 * ถ้า provider ถูก unmount ระหว่างรอ promise จะ resolve เป็นการยกเลิก ไม่ค้าง
 */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('common');
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  // เก็บอันล่าสุดไว้ให้ Modal เล่น fade-out โดยเนื้อหาไม่หายไปก่อน
  const [lastShown, setLastShown] = useState<DialogRequest | null>(null);
  // iOS: Modal ที่เพิ่งสั่งปิดยังเล่น fade-out อยู่ ถ้าสั่ง visible กลับเป็น true ระหว่างนั้น
  // UIKit จะไม่ present ให้ (dialog ไม่ขึ้นและ promise ค้างตลอดไป) จึงต้องรอ onDismiss ก่อน
  const [dismissing, setDismissing] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);
  const pendingRef = useRef(new Set<DialogRequest>());

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      pending.forEach(request => request.resolve(false));
      pending.clear();
    };
  }, []);

  const enqueue = useCallback((request: DialogRequest) => {
    pendingRef.current.add(request);
    setQueue(current => [...current, request]);
  }, []);

  const settle = useCallback((request: DialogRequest, value: boolean) => {
    pendingRef.current.delete(request);
    request.resolve(value);
    setLastShown(request);
    setQueue(current => current.filter(item => item !== request));
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      alert: options =>
        new Promise<void>(resolve => {
          enqueue({ kind: 'alert', options, resolve: once(() => resolve()) });
        }),
      confirm: options =>
        new Promise<boolean>(resolve => {
          enqueue({ kind: 'confirm', options, resolve: once(resolve) });
        }),
    }),
    [enqueue],
  );

  const current = queue[0];
  const visible = current !== undefined && !dismissing;
  // ระหว่าง fade-out ให้คงเนื้อหาเดิมไว้ ไม่สลับเป็น dialog ถัดไปที่รอคิวอยู่
  const shown = visible ? current : lastShown ?? current;

  // จับจังหวะ visible true -> false ระหว่าง render (ไม่ใช้ effect เพื่อไม่ให้มีช่วงที่เปิดซ้ำได้ก่อน effect ทำงาน)
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (wasVisible && Platform.OS === 'ios') {
      setDismissing(true);
    }
  }

  useEffect(() => {
    if (!dismissing) {
      return;
    }
    const timer = setTimeout(() => setDismissing(false), DISMISS_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [dismissing]);

  const handleDismiss = useCallback(() => setDismissing(false), []);

  let actions: DialogAction[] = [];
  if (shown?.kind === 'alert') {
    actions = [
      {
        label: shown.options.okLabel ?? t('ok'),
        onPress: () => settle(shown, true),
      },
    ];
  } else if (shown?.kind === 'confirm') {
    actions = [
      {
        label: shown.options.cancelLabel ?? t('cancel'),
        variant: 'outline',
        onPress: () => settle(shown, false),
      },
      {
        label: shown.options.confirmLabel ?? t('confirm'),
        variant: shown.options.destructive ? 'danger' : 'primary',
        onPress: () => settle(shown, true),
      },
    ];
  }

  return (
    <DialogContext.Provider value={api}>
      {children}
      {shown ? (
        <Dialog
          visible={visible}
          title={shown.options.title}
          message={shown.options.message}
          dismissible={shown.options.dismissible ?? true}
          actions={actions}
          onRequestClose={() => settle(shown, false)}
          onDismiss={handleDismiss}
        />
      ) : null}
    </DialogContext.Provider>
  );
}
