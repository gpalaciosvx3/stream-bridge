import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { JobRecord } from '../../domain/types/job-record.types';
import { ValidatedJobUpdate } from '../../domain/types/validated-job-update.types';

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

  async updateValidationResult(jobId: string, update: ValidatedJobUpdate): Promise<void> {
    await this.dynamo.updateFields(this.table, { jobId }, {
      status:      update.status,
      validRows:   update.validRows,
      invalidRows: update.invalidRows,
      updatedAt:   update.updatedAt,
    });
  }
}
