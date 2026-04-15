import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { JobEntity } from '../../domain/entities/job.entity';

@Injectable()
export class JobDbRepositoryImpl extends JobDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly table: string,
  ) {
    super();
  }

  async save(job: JobEntity): Promise<void> {
    await this.dynamo.put(this.table, {
      jobId: job.jobId,
      clientId: job.clientId,
      status: job.status,
      sourceKey: job.sourceKey,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      expiresAt: job.expiresAt,
    });
  }
}
