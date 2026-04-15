import { Injectable } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../../../common/s3/s3.client';
import { PresignedUrlS3Repository } from '../../domain/repository/presigned-url.s3.repository';

@Injectable()
export class PresignedUrlS3RepositoryImpl extends PresignedUrlS3Repository {
  constructor(private readonly bucket: string) {
    super();
  }

  async generatePutUrl(key: string, contentType: string, expiresIn: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(s3Client, command, { expiresIn });
  }
}
