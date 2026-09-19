import { configureStore } from '@reduxjs/toolkit';

import { listenerMiddleware } from './listeners';
import { loadPersistedState, subscribePersistence } from './persistence';
import { rootReducer } from './rootReducer';

export function createStore(preloadedState = loadPersistedState()) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  });
}

export const store = createStore();

subscribePersistence(store);

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore['dispatch'];
export type { RootState } from './rootReducer';
