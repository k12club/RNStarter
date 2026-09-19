import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/services/query/queryKeys';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCurrentUser,
  selectIsSignedIn,
  userUpdated,
} from '@/store/slices/authSlice';

import { authApi, type LoginInput } from '../api/authApi';
import { endSession, startSession } from '../session';

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async ({ user, tokens }) => {
      await startSession(user, tokens);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => endSession(),
  });
}

/**
 * ข้อมูลผู้ใช้ปัจจุบัน: แสดงค่าจาก Redux ทันที แล้ว sync กับ /auth/me เบื้องหลัง
 * (เปิดแอปครั้งถัดไป Redux ยังไม่มี user จนกว่า query นี้จะโหลดเสร็จ)
 */
export function useCurrentUser() {
  const dispatch = useAppDispatch();
  const isSignedIn = useAppSelector(selectIsSignedIn);
  const cachedUser = useAppSelector(selectCurrentUser);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authApi.me,
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(userUpdated(query.data));
    }
  }, [dispatch, query.data]);

  return { ...query, user: query.data ?? cachedUser };
}
