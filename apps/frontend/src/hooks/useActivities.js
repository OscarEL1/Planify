import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActivities,
  getActivityStats,
  getActivityById,
  createActivity,
  updateActivity,
  updateActivityStatus,
  updateActivityEvidence,
  deleteActivity,
  getUsers,
  addComment,
} from '../services/activityService';

export const ACTIVITIES_KEY = ['activities'];
export const USERS_KEY = ['users'];

export const ACTIVITY_STATS_KEY = ['activities', 'stats'];

export function useActivitiesQuery() {
  return useQuery({ queryKey: ACTIVITIES_KEY, queryFn: getActivities });
}

export function useActivityStatsQuery() {
  return useQuery({
    queryKey: ACTIVITY_STATS_KEY,
    queryFn: getActivityStats,
  });
}

export function useActivityByIdQuery(id) {
  return useQuery({ queryKey: ['activity', id], queryFn: () => getActivityById(id), enabled: !!id });
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
export function useUpdateActivityStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => updateActivityStatus(id, status),

    onSuccess: (updatedActivity) => {
      queryClient.setQueryData(ACTIVITIES_KEY, (old = []) =>
        old.map((activity) =>
          activity.id === updatedActivity.id ? updatedActivity : activity
        )
      );

      queryClient.invalidateQueries({
        queryKey: ACTIVITY_STATS_KEY,
      });
    },
  });
}

export function useUpdateActivityEvidenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, evidenceUrl }) => updateActivityEvidence(id, evidenceUrl),
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

export function useAddCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, text }) => addComment(activityId, text),

    onSuccess: (newComment, { activityId }) => {
      queryClient.setQueryData(ACTIVITIES_KEY, (old = []) =>
        old.map((activity) => {
          if (activity.id !== activityId) return activity;

          return {
            ...activity,
            comments: [...(activity.comments || []), newComment],
          };
        })
      );

      queryClient.setQueryData(['activity', activityId], (old) => {
        if (!old) return old;

        return {
          ...old,
          comments: [...(old.comments || []), newComment],
        };
      });
    },
  });
}
