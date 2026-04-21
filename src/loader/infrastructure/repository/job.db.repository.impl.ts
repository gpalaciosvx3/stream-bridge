import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { JobRecord } from '../../domain/types/job-record.types';
import { LoadedJobUpdate } from '../../domain/types/loaded-job-update.types';

@Injectable()
export class JobDbRepositoryImpl extends JobDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly table:  string,
  ) {
    super();
  }

  async getById(jobId: string): Promise<JobRecord | null> {
    return this.dynamo.get<JobRecord>(this.table, { jobId });
  }

  async updateLoadResult(jobId: string, update: LoadedJobUpdate): Promise<void> {
    await this.dynamo.updateFields(this.table, { jobId }, {
      status:       update.status,
      processedKey: update.processedKey,
      completedAt:  update.completedAt,
      duration:     update.duration,
      updatedAt:    update.updatedAt,
    });
  }
}
