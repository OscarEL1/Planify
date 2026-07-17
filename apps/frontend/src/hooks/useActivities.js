import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createActivity,
  updateActivity,
  getUsers,
} from '../services/activityService';

export const USERS_KEY = ['users'];

export function useUsersQuery() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: getUsers,
    retry: false,
  });
}

export function useCreateActivityMutation() {
  return useMutation({
    mutationFn: createActivity,
  });
}

export function useUpdateActivityMutation() {
  return useMutation({
    mutationFn: ({ id, payload }) => updateActivity(id, payload),
  });
}