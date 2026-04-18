import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../../common/config/aws.config';
import { StagedFileS3Repository } from '../../domain/repository/staged-file.s3.repository';
import { ParsedFile } from '../../domain/types/parsed-file.types';

export class StagedFileS3RepositoryImpl extends StagedFileS3Repository {
  async upload(bucket: string, key: string, content: ParsedFile): Promise<void> {
    await s3Client.send(
      new PutObjectCommand({
        Bucket:      bucket,
        Key:         key,
        Body:        JSON.stringify(content),
        ContentType: 'application/json',
      }),
    );
  }
}
