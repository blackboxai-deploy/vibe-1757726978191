// API client for stealer parser backend

const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.protocol + '//' + window.location.hostname + ':8000'
  : 'http://localhost:8000';

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  error?: string;
}

export interface ParsedData {
  filename: string;
  systems_data: Array<{
    system: {
      machine_id?: string;
      computer_name?: string;
      hardware_id?: string;
      machine_user?: string;
      ip_address?: string;
      country?: string;
      log_date?: string;
    } | null;
    credentials: Array<{
      software?: string;
      host?: string;
      username?: string;
      password?: string;
      domain?: string;
      local_part?: string;
      email_domain?: string;
      filepath?: string;
      stealer_name?: string;
    }>;
    cookies: Array<{
      domain: string;
      name: string;
      value: string;
      browser?: string;
      secure: boolean;
      expiry: string;
      filepath?: string;
      stealer_name?: string;
    }>;
  }>;
}

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async uploadFile(file: File, password?: string): Promise<{ job_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (password) {
      formData.append('password', password);
    }

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/api/status/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    return response.json();
  }

  async getJobResult(jobId: string): Promise<ParsedData> {
    const response = await fetch(`${this.baseUrl}/api/result/${jobId}`);
    
    if (!response.ok) {
      if (response.status === 202) {
        throw new Error('Job still processing');
      }
      const error = await response.json().catch(() => ({ detail: 'Failed to get result' }));
      throw new Error(error.detail || 'Failed to get result');
    }

    return response.json();
  }

  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete job');
    }
  }

  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    
    if (!response.ok) {
      throw new Error('API health check failed');
    }

    return response.json();
  }
}

// Default API client instance
export const apiClient = new APIClient();