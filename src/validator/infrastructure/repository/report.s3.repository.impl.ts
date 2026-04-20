import { Injectable } from '@nestjs/common';
import { S3Client } from '../../../common/s3/s3.client';
import { ReportS3Repository } from '../../domain/repository/report.s3.repository';
import { ValidationReport } from '../../domain/types/validation-report.types';

@Injectable()
export class ReportS3RepositoryImpl extends ReportS3Repository {
  constructor(
    private readonly s3:     S3Client,
    private readonly bucket: string,
  ) {
    super();
  }

  async upload(key: string, report: ValidationReport): Promise<void> {
    await this.s3.putObject(this.bucket, key, JSON.stringify(report), 'application/json');
  }
}
