import { Readable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../../common/config/aws.config';
import { RawFileS3Repository } from '../../domain/repository/raw-file.s3.repository';

export class RawFileS3RepositoryImpl extends RawFileS3Repository {
  async download(bucket: string, key: string): Promise<Buffer> {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
