import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OpenPechaText } from '../types/text';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Real API function for Texts
const fetchTexts = async (params?: { limit?: number; offset?: number; language?: string; author?: string }): Promise<OpenPechaText[]> => {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.language) queryParams.append('language', params.language);
  if (params?.author) queryParams.append('author', params.author);
  
  const url = `${API_URL}/text${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || data || [];
};

// Real API function for creating texts
const createText = async (textData: {
  type: string;
  title: { [key: string]: string };
  language: string;
  contributions?: Array<{ person_id: string; role: string }>;
  date?: string;
  bdrc?: string;
  alt_titles?: Array<{ [key: string]: string }>;
}): Promise<OpenPechaText> => {
  const response = await fetch(`${API_URL}/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(textData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Text hooks
export const useTexts = (params?: { limit?: number; offset?: number; language?: string; author?: string }) => {
  return useQuery({
    queryKey: ['texts', params],
    queryFn: () => fetchTexts(params),
    select: (data) => data.results || data || [],
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useCreateText = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['texts'] });
    },
    onError: (error) => {
      console.error('Error creating text:', error);
    }
  });
};