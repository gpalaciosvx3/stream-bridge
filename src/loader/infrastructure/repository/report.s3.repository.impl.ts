import { Injectable } from '@nestjs/common';
import { S3Client } from '../../../common/s3/s3.client';
import { ReportS3Repository } from '../../domain/repository/report.s3.repository';
import { ValidationReportRecord } from '../../domain/types/validation-report-record.types';

@Injectable()
export class ReportS3RepositoryImpl extends ReportS3Repository {
  constructor(
    private readonly s3:     S3Client,
    private readonly bucket: string,
  ) {
    super();
  }

  async download(key: string): Promise<ValidationReportRecord> {
    const buffer = await this.s3.getObject(this.bucket, key);
    return JSON.parse(buffer.toString('utf-8')) as ValidationReportRecord;
  }
}
