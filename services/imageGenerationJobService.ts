import { ImageGenerationJob } from '../types/chat';
import { User } from 'firebase/auth';
// import OpenAI from 'openai'; // Commented out as we're using direct HTTP calls

export interface ImageGenerationJobParams {
  prompt: string;
  model: string;
  size?: string;
  response_format?: 'url' | 'b64_json';
  seed?: number;
  guidance_scale?: number;
  watermark?: boolean;
  image?: string;
}

export interface ImageGenerationJobConfig {
  baseURL: string;
  apiKey: string;
  requiresAuth: boolean;
}

export class ImageGenerationJobService {
  private static activeJobs: Map<string, NodeJS.Timeout> = new Map(); // Now stores setInterval IDs
  private static jobStates: Map<string, ImageGenerationJob> = new Map();
  private static startingJobs: Set<string> = new Set(); // Track jobs that are in the process of starting

  // Unused for now - keeping for potential future use
  // private static createOpenAIInstance(idToken?: string, baseURL?: string, apiKey?: string) {
  //   const headers: Record<string, string> = {
  //     'Content-Type': 'application/json',
  //   };

  //   // Add Firebase ID token as Authorization header if available
  //   if (idToken) {
  //     headers['Authorization'] = `Bearer ${idToken}`;
  //   }

  //   return new OpenAI({
  //     apiKey: apiKey || "",
  //     baseURL: baseURL || "",
  //     defaultHeaders: headers,
  //     dangerouslyAllowBrowser: true
  //   });
  // }

  private static getProviderConfig(source: string, providerId?: string): ImageGenerationJobConfig {
    if (source === 'system') {
      return {
        baseURL: import.meta.env.VITE_FIREBASE_FUNC_BASE_API,
        apiKey: "",
        requiresAuth: true
      };
    }

    if (source === 'builtin' && providerId) {
      try {
        const builtInProviders = localStorage.getItem('builtin_api_providers');
        if (builtInProviders) {
          const providers = JSON.parse(builtInProviders);
          const provider = providers.find((p: any) => p.id === providerId);
          if (provider) {
            return {
              baseURL: provider.base_url,
              apiKey: provider.value,
              requiresAuth: false
            };
          }
        }
      } catch (error) {
        console.error('Error loading built-in provider config:', error);
      }
    }

    if (source === 'custom' && providerId) {
      try {
        const customProviders = localStorage.getItem('custom_api_providers');
        if (customProviders) {
          const providers = JSON.parse(customProviders);
          const provider = providers.find((p: any) => p.id === providerId);
          if (provider) {
            return {
              baseURL: provider.base_url,
              apiKey: provider.value,
              requiresAuth: false
            };
          }
        }
      } catch (error) {
        console.error('Error loading custom provider config:', error);
      }
    }

    throw new Error('No valid provider configuration found for image generation jobs');
  }

  // Create a new image generation job
  static async createImageGenerationJob(
    params: ImageGenerationJobParams,
    source: string = 'system',
    providerId?: string,
    user?: User | null
  ): Promise<ImageGenerationJob> {
    try {
      const config = this.getProviderConfig(source, providerId);
      let idToken: string | undefined;

      // Get Firebase ID token if required and user is authenticated
      if (config.requiresAuth && user) {
        try {
          idToken = await user.getIdToken();
        } catch (tokenError) {
          console.warn('Failed to get Firebase ID token:', tokenError);
        }
      }

      // Create OpenAI instance with the appropriate configuration (not used for direct HTTP calls)
      // const openai = this.createOpenAIInstance(idToken, config.baseURL, config.apiKey);

      // Prepare job creation parameters
      const jobParams: any = {
        model: params.model,
        prompt: params.prompt,
        size: params.size || "1024x1024",
      };

      // Add optional parameters if provided
      if (params.seed !== undefined && params.seed !== -1) {
        jobParams.seed = params.seed;
      }
      if (params.guidance_scale !== undefined) {
        jobParams.guidance_scale = params.guidance_scale;
      }
      if (params.watermark !== undefined) {
        jobParams.watermark = params.watermark;
      }
      if (params.image) {
        jobParams.image = params.image;
      }

      // Make the job creation request
      const jobsUrl = `${config.baseURL.replace(/\/$/, '')}/images/jobs`;
      const response = await fetch(jobsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
          ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify(jobParams),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      const job: ImageGenerationJob = {
        id: responseData.job.id,
        model: responseData.model,
        created: responseData.created,
        status: responseData.job.status,
        prompt: params.prompt,
        size: params.size || "1024x1024",
        data: responseData.data || [],
        info: responseData.job.info || undefined,
      };

      return job;
    } catch (error: any) {
      console.error('Error creating image generation job:', error);
      throw error;
    }
  }

  // Check job status
  static async checkJobStatus(
    jobId: string,
    source: string = 'system',
    providerId?: string,
    user?: User | null
  ): Promise<ImageGenerationJob> {
    try {
      const config = this.getProviderConfig(source, providerId);
      let idToken: string | undefined;

      // Get Firebase ID token if required and user is authenticated
      if (config.requiresAuth && user) {
        try {
          idToken = await user.getIdToken();
        } catch (tokenError) {
          console.warn('Failed to get Firebase ID token:', tokenError);
        }
      }

      // Make the job status request
      const jobsUrl = `${config.baseURL.replace(/\/$/, '')}/images/jobs/${jobId}`;
      const response = await fetch(jobsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
          ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      const job: ImageGenerationJob = {
        id: responseData.job.id,
        model: responseData.model,
        created: responseData.created,
        status: responseData.job.status,
        prompt: '', // We don't get prompt back from status endpoint
        size: '', // We don't get size back from status endpoint
        data: responseData.data || [],
        info: responseData.job.info || undefined,
      };

      return job;
    } catch (error: any) {
      console.error('Error checking job status:', error);
      throw error;
    }
  }

  // Save job to Firestore - now stored directly in the conversation message
  static async saveJobToFirestore(_userId: string, _job: ImageGenerationJob): Promise<void> {
    // Job data is now stored directly in the ChatMessage.imageGenerationJob field
    // This method is kept for compatibility but doesn't need to do anything
    // since the job data is saved when the conversation is saved
  }

  // Get job from Firestore - now retrieved from conversation message
  static async getJobFromFirestore(_userId: string, _jobId: string): Promise<ImageGenerationJob | null> {
    // Job data is now stored directly in the ChatMessage.imageGenerationJob field
    // This method would need to search through conversations to find the job
    // For now, return null as the polling will handle updates through message state
    return null;
  }

  // Start polling for job status
  static startJobPolling(
    jobId: string,
    source: string,
    providerId: string | undefined,
    user: User | null,
    onUpdate: (job: ImageGenerationJob) => void,
    onComplete: (job: ImageGenerationJob) => void,
    onError: (error: Error) => void
  ): void {
    // Prevent multiple simultaneous starts for the same job
    if (this.startingJobs.has(jobId)) {
      return;
    }

    // Check if we're already polling this job
    if (this.activeJobs.has(jobId)) {
      return;
    }
    
    // Mark job as starting
    this.startingJobs.add(jobId);
    

    const pollJob = async () => {
      try {
        // Check if job is still active before making the API call
        if (!this.activeJobs.has(jobId)) {
          return;
        }

        
        // Check job status from API
        const statusJob = await this.checkJobStatus(jobId, source, providerId, user);
        
        // Check if job is still active after API call
        if (!this.activeJobs.has(jobId)) {
          return;
        }

        // Get previous job state to compare for changes
        const previousJob = this.jobStates.get(jobId);
        let hasChanges = false;

        if (!previousJob) {
          // First time polling this job
          hasChanges = true;
        } else {
          // Check for meaningful changes
          hasChanges = 
            previousJob.status !== statusJob.status ||
            previousJob.data?.length !== statusJob.data?.length ||
            JSON.stringify(previousJob.info) !== JSON.stringify(statusJob.info);
        }

        // Store current state for next comparison
        this.jobStates.set(jobId, statusJob);

        // Only call onUpdate if there are changes
        if (hasChanges) {
          onUpdate(statusJob);
        }

        // Check if job is complete
        if (statusJob.status === 'SUCCESS' || statusJob.status === 'FAILED') {
          this.stopJobPolling(jobId);
          onComplete(statusJob);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        
        // Check if job is still active before handling error
        if (!this.activeJobs.has(jobId)) {
          return;
        }
        
        onError(error as Error);
      }
    };

    // Start interval polling every 3 seconds (no immediate poll)
    const intervalId = setInterval(pollJob, 3000); // Poll every 3 seconds
    this.activeJobs.set(jobId, intervalId);
    
    // Remove from starting set
    this.startingJobs.delete(jobId);

    // Do first poll after 1 second (not immediately to avoid burst)
    setTimeout(pollJob, 1000);
  }

  // Stop polling for a specific job
  static stopJobPolling(jobId: string): void {
    const intervalId = this.activeJobs.get(jobId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeJobs.delete(jobId);
    } 
    // Clean up stored job state and starting status
    this.jobStates.delete(jobId);
    this.startingJobs.delete(jobId);
  }

  // Check if a job is currently being polled or starting
  static isJobBeingPolled(jobId: string): boolean {
    return this.activeJobs.has(jobId) || this.startingJobs.has(jobId);
  }

  // Stop all polling
  static stopAllPolling(): void {
    // Clear all intervals
    this.activeJobs.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.activeJobs.clear();
    
    // Clear all stored job states and starting statuses
    this.jobStates.clear();
    this.startingJobs.clear();
  }

  // Get all active jobs for a user - search through conversation messages
  static async getActiveJobsForUser(_userId: string): Promise<ImageGenerationJob[]> {
    // This method should be called from the hook context where conversations are available
    // For now, return empty array since we'll handle this logic in the hook
    return [];
  }

  // Get current polling status (for debugging)
  static getPollingStatus(): { activeJobs: string[], jobStates: string[] } {
    return {
      activeJobs: Array.from(this.activeJobs.keys()),
      jobStates: Array.from(this.jobStates.keys())
    };
  }
}
