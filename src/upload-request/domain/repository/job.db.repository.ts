import { JobEntity } from '../entities/job.entity';
import { JobStatus } from '../../../common/types/job-status.types';

export abstract class JobDbRepository {
  abstract save(job: JobEntity): Promise<void>;
  abstract findActiveByClientAndFilename(clientId: string, filename: string, statuses: readonly JobStatus[]): Promise<boolean>;
}
