import { Injectable } from '@nestjs/common';
import { S3Client } from '../../../common/s3/s3.client';
import { PresignedUrlS3Repository } from '../../domain/repository/presigned-url.s3.repository';

@Injectable()
export class PresignedUrlS3RepositoryImpl extends PresignedUrlS3Repository {
  constructor(
    private readonly s3:     S3Client,
    private readonly bucket: string,
  ) {
    super();
  }

  async generatePutUrl(key: string, contentType: string, expiresIn: number): Promise<string> {
    return this.s3.getSignedPutUrl(this.bucket, key, contentType, expiresIn);
  }
}
