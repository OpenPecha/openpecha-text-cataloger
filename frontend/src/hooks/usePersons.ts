import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Person, CreatePersonData, UpdatePersonData } from '../types/person';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

// Real API function for Person
const fetchPersons = async (params?: { limit?: number; offset?: number; nationality?: string; occupation?: string }): Promise<Person[]> => {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.nationality) queryParams.append('nationality', params.nationality);
  if (params?.occupation) queryParams.append('occupation', params.occupation);
  
  const url = queryParams.toString() ? `${API_URL}/person?${queryParams.toString()}` : `${API_URL}/person`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || data || [];
};

const createPerson = async (data: CreatePersonData): Promise<Person> => {
  const response = await fetch(`${API_URL}/person`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

const updatePerson = async (data: UpdatePersonData): Promise<Person> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: data.id,
    name: data.name || '',
    bdrc_id: data.bdrc_id,
    birth_year: data.birth_year,
    death_year: data.death_year,
    nationality: data.nationality,
    occupation: data.occupation,
    description: data.description,
    wiki_url: data.wiki_url,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  };
};

const deletePerson = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
};

// Text hooks (existing)
export const useTexts = () => {
  return useQuery({
    queryKey: ['texts'],
    queryFn: fetchTexts,
    select: (data) => data.results || data || [],
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Person hooks
export const usePersons = (params?: { limit?: number; offset?: number; nationality?: string; occupation?: string }) => {
  return useQuery({
    queryKey: ['persons', params],
    queryFn: () => fetchPersons(params),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useCreatePerson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    }
  });
};

export const useUpdatePerson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    }
  });
};

export const useDeletePerson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePerson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    }
  });
};
