import {
  createText,
  createTextInstance,
  fetchInstance,
  fetchText,
  fetchTextInstances,
  fetchTexts,
} from "@/api/texts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Text hooks
export const useTexts = (params?: {
  limit?: number;
  offset?: number;
  language?: string;
  author?: string;
}) => {
  return useQuery({
    queryKey: ["texts", params],
    queryFn: () => fetchTexts(params),
    select: (data) => data.results || data || [],
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useText = (id: string) => {
  return useQuery({
    queryKey: ["text", id],
    queryFn: () => fetchText(id),
    select: (data) => data.results || data || [],
  });
};

export const useTextInstance = (id: string) => {
  return useQuery({
    queryKey: ["textInstance", id],
    queryFn: () => fetchTextInstances(id),
    select: (data) => data.results || data || [],
  });
};

export const useInstance = (id: string) => {
  return useQuery({
    queryKey: ["instance", id],
    queryFn: () => fetchInstance(id),
    select: (data) => data.results || data || [],
  });
};

export const useCreateText = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texts"] });
    }
  });
};

export const useCreateTextInstance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      textId,
      instanceData,
    }: {
      textId: string;
      instanceData: any;
    }) => createTextInstance(textId, instanceData),
    onSuccess: (_, { textId }) => {
      queryClient.invalidateQueries({ queryKey: ["textInstance", textId] });
    }
  });
};
