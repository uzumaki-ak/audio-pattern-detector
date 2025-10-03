
import axios from 'axios';
import { AnalysisResult } from 'types';
import { createClient } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export async function analyzeAudio(
  patternFile: File,
  targetFile: File
): Promise<AnalysisResult> {
  console.log('📤 Uploading files for analysis...');

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be signed in to analyze audio');
  }

  const formData = new FormData();
  formData.append('pattern', patternFile);
  formData.append('target', targetFile);
  formData.append('user_id', user.id); // Send user ID to backend

  try {
    const response = await api.post('/api/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Analysis completed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Analysis failed:', error);
    
    if (error.response) {
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response from server. Check if backend is running on port 8000.');
    } else {
      throw new Error(error.message || 'Analysis failed');
    }
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const response = await api.get('/api/health');
    return response.status === 200;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
}

export async function getApiDocs() {
  try {
    const response = await api.get('/api/docs');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch API docs:', error);
    return null;
  }
}