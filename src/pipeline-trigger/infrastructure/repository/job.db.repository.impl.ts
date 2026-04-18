import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { JobRecord } from '../../domain/types/job-record.types';
import { JobStatus } from '../../../common/types/job-status.types';

@Injectable()
export class JobDbRepositoryImpl extends JobDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly table: string,
  ) {
    super();
  }

  async getById(jobId: string): Promise<JobRecord | null> {
    return this.dynamo.get<JobRecord>(this.table, { jobId });
  }

  async transitionToProcessing(jobId: string): Promise<void> {
    await this.dynamo.updateFieldsAndRemove(
      this.table,
      { jobId },
      { status: JobStatus.PROCESSING, updatedAt: new Date().toISOString() },
      ['expiresAt'],
    );
  }
}
