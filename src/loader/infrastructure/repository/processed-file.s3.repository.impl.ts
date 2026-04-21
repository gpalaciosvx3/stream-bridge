import { Injectable } from '@nestjs/common';
import { S3Client } from '../../../common/s3/s3.client';
import { ProcessedFileS3Repository } from '../../domain/repository/processed-file.s3.repository';
import { ProcessedFile } from '../../domain/types/processed-file.types';

@Injectable()
export class ProcessedFileS3RepositoryImpl extends ProcessedFileS3Repository {
  constructor(
    private readonly s3:     S3Client,
    private readonly bucket: string,
  ) {
    super();
  }

  async upload(key: string, content: ProcessedFile): Promise<void> {
    await this.s3.putObject(this.bucket, key, JSON.stringify(content), 'application/json');
  }
}
