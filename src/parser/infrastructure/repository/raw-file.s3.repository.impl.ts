import { S3Client } from '../../../common/s3/s3.client';
import { RawFileS3Repository } from '../../domain/repository/raw-file.s3.repository';

export class RawFileS3RepositoryImpl extends RawFileS3Repository {
  constructor(private readonly s3: S3Client) {
    super();
  }

  async download(bucket: string, key: string): Promise<Buffer> {
    return this.s3.getObject(bucket, key);
  }
}
