import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { JobEntity } from '../../domain/entities/job.entity';
import { JobStatus } from '../../../common/types/job-status.types';

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
      jobId:       job.jobId,
      clientId:    job.clientId,
      filename:    job.filename,
      contentType: job.contentType,
      status:      job.status,
      sourceKey:   job.sourceKey,
      createdAt:   job.createdAt,
      updatedAt:   job.updatedAt,
      expiresAt:   job.expiresAt,
    });
  }

  async findActiveByClientAndFilename(clientId: string, filename: string, statuses: readonly JobStatus[]): Promise<boolean> {
    const statusPlaceholders = statuses.map((_, i) => `:s${i}`).join(', ');
    const statusValues = Object.fromEntries(statuses.map((s, i) => [`:s${i}`, s]));

    const results = await this.dynamo.query<{ filename: string }>(this.table, {
      index:        'clientId-index',
      keyCondition: '#clientId = :clientId',
      filterExpression: `#filename = :filename AND #status IN (${statusPlaceholders})`,
      attributeNames:  { '#clientId': 'clientId', '#filename': 'filename', '#status': 'status' },
      attributeValues: { ':clientId': clientId, ':filename': filename, ...statusValues },
    });

    return results.length > 0;
  }
}
