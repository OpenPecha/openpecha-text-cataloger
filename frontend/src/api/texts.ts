
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
import type { OpenPechaText, OpenPechaTextInstance } from '@/types/text';

// Real API function for Texts
export const fetchTexts = async (params?: { limit?: number; offset?: number; language?: string; author?: string }): Promise<OpenPechaText[]> => {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.language) queryParams.append('language', params.language);
  if (params?.author) queryParams.append('author', params.author);
  
  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}/text?${queryString}` : `${API_URL}/text`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || data || [];
};
export const fetchText = async (id: string): Promise<OpenPechaText> => {
  const response = await fetch(`${API_URL}/text/${id}`);
  return response.json();
};

// Real API function for creating texts
export const createText = async (textData: {
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

export const fetchTextInstances = async (id: string): Promise<OpenPechaTextInstance> => {
  const response = await fetch(`${API_URL}/text/${id}/instances`);
  return response.json();
};

export const fetchInstance = async (id: string): Promise<OpenPechaTextInstance> => {
  const response = await fetch(`${API_URL}/text/instances/${id}`);
  return response.json();
};

// Real API function for creating text instances
export const createTextInstance = async (textId: string, instanceData: any): Promise<OpenPechaTextInstance> => {
  console.log(`Creating instance for text ${textId}:`, instanceData);
  
  const response = await fetch(`${API_URL}/text/${textId}/instances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(instanceData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Instance creation failed:', response.status, errorText);
    
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.detail || errorData.details || errorData.message || `HTTP error! status: ${response.status}`);
    } catch (e) {
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
  }

  return await response.json();
};