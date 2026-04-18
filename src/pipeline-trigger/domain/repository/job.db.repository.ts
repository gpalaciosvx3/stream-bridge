import { JobRecord } from '../types/job-record.types';

export abstract class JobDbRepository {
  abstract getById(jobId: string): Promise<JobRecord | null>;
  abstract transitionToProcessing(jobId: string): Promise<void>;
}
