import { JobRecord } from '../types/job-record.types';
import { ValidatedJobUpdate } from '../types/validated-job-update.types';

export abstract class JobDbRepository {
  abstract getById(jobId: string): Promise<JobRecord | null>;
  abstract updateValidationResult(jobId: string, update: ValidatedJobUpdate): Promise<void>;
}
