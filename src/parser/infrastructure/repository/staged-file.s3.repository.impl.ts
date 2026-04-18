import { S3Client } from '../../../common/s3/s3.client';
import { StagedFileS3Repository } from '../../domain/repository/staged-file.s3.repository';
import { ParsedFile } from '../../domain/types/parsed-file.types';

export class StagedFileS3RepositoryImpl extends StagedFileS3Repository {
  constructor(private readonly s3: S3Client) {
    super();
  }

  async upload(bucket: string, key: string, content: ParsedFile): Promise<void> {
    await this.s3.putObject(bucket, key, JSON.stringify(content), 'application/json');
  }
}
