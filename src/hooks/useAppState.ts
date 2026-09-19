import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type Options = {
  /** เรียกเมื่อแอปกลับมาอยู่หน้าจอ (background/inactive -> active) */
  onForeground?: () => void;
  /** เรียกเมื่อแอปออกจากหน้าจอ (active -> background) */
  onBackground?: () => void;
};

/** สถานะของแอป (active / background / inactive) พร้อม callback ตอนเข้า-ออก */
export function useAppState({ onForeground, onBackground }: Options = {}) {
  const [appState, setAppState] = useState<AppStateStatus>(
    (AppState.currentState as AppStateStatus | null | undefined) ?? 'active',
  );
  const handlers = useRef({ onForeground, onBackground });

  useEffect(() => {
    handlers.current = { onForeground, onBackground };
  }, [onForeground, onBackground]);

  useEffect(() => {
    let previous: string = AppState.currentState ?? 'active';
    const subscription = AppState.addEventListener('change', next => {
      if (previous.match(/inactive|background/) && next === 'active') {
        handlers.current.onForeground?.();
      } else if (previous === 'active' && next === 'background') {
        handlers.current.onBackground?.();
      }
      previous = next;
      setAppState(next);
    });
    return () => subscription.remove();
  }, []);

  return appState;
}
