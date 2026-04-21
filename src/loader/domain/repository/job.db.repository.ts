import { JobRecord } from '../types/job-record.types';
import { LoadedJobUpdate } from '../types/loaded-job-update.types';

export abstract class JobDbRepository {
  abstract getById(jobId: string): Promise<JobRecord | null>;
  abstract updateLoadResult(jobId: string, update: LoadedJobUpdate): Promise<void>;
}
