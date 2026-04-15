import { JobEntity } from '../entities/job.entity';

export abstract class JobDbRepository {
  abstract save(job: JobEntity): Promise<void>;
}
