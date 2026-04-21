import { Injectable } from '@nestjs/common';
import { S3Client } from '../../../common/s3/s3.client';
import { StagedFileS3Repository } from '../../domain/repository/staged-file.s3.repository';
import { StagedParsedFile } from '../../domain/types/staged-parsed-file.types';

@Injectable()
export class StagedFileS3RepositoryImpl extends StagedFileS3Repository {
  constructor(
    private readonly s3:     S3Client,
    private readonly bucket: string,
  ) {
    super();
  }

  async download(key: string): Promise<StagedParsedFile> {
    const buffer = await this.s3.getObject(this.bucket, key);
    return JSON.parse(buffer.toString('utf-8')) as StagedParsedFile;
  }
}
