import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from './rootReducer';

import type { AppDispatch } from './index';

/** ใช้สองตัวนี้แทน useDispatch / useSelector เพื่อให้ได้ type ที่ถูกต้อง */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
