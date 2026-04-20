import { JobRecord } from '../types/job-record.types';
import { ParsedJobUpdate } from '../types/parsed-job-update.types';

export abstract class JobDbRepository {
  abstract getById(jobId: string): Promise<JobRecord | null>;
  abstract transitionToProcessing(jobId: string, updatedAt: string): Promise<void>;
  abstract transitionToParsed(jobId: string, update: ParsedJobUpdate): Promise<void>;
}
