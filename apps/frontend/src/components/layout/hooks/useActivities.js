import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActivities, createActivity, updateActivity, deleteActivity, getUsers } from '../services/activityService';

export const ACTIVITIES_KEY = ['activities'];
export const USERS_KEY = ['users'];

export function useActivitiesQuery() {
  return useQuery({ queryKey: ACTIVITIES_KEY, queryFn: getActivities });
}

export function useUsersQuery() {
  return useQuery({ queryKey: USERS_KEY, queryFn: getUsers });
}

export function useCreateActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createActivity,
    onSuccess: (newActivity) => {
      queryClient.setQueryData(ACTIVITIES_KEY, (old = []) => [...old, newActivity]);
    },
  });
}

export function useUpdateActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateActivity(id, payload),
    onSuccess: (updatedActivity) => {
      queryClient.setQueryData(ACTIVITIES_KEY, (old = []) =>
        old.map((activity) => (activity.id === updatedActivity.id ? updatedActivity : activity))
      );
    },
  });
}

export function useDeleteActivityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: (deletedId) => {
      queryClient.setQueryData(ACTIVITIES_KEY, (old = []) =>
        old.filter((activity) => activity.id !== deletedId)
      );
    },
  });
}