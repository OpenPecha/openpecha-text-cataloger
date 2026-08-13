import { useQuery } from '@tanstack/react-query';
import {
  getAnnotatorWeeklyQuality,
  type AnnotatorWeeklyBucketBy,
  type AnnotatorWeeklyQualityResponse,
} from '@/api/outliner';

export interface AnnotatorWeeklyQualityFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  bucketBy?: AnnotatorWeeklyBucketBy;
  /** Only fetch once the timeline is opened, so the overview keeps its current cost. */
  enabled?: boolean;
}

export function useAnnotatorWeeklyQuality(filters: AnnotatorWeeklyQualityFilters = {}) {
  const { userId, startDate, endDate, bucketBy = 'reviewed', enabled = true } = filters;

  const { data, isLoading, error, refetch } = useQuery<AnnotatorWeeklyQualityResponse>({
    queryKey: ['annotator-weekly-quality', { userId, startDate, endDate, bucketBy }],
    queryFn: () => getAnnotatorWeeklyQuality(bucketBy, userId, startDate, endDate),
    staleTime: 2 * 60 * 1000,
    enabled,
  });

  return { weekly: data, isLoading, error, refetch };
}
