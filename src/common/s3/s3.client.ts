import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/aws.config';
import { awsError } from '../errors/aws-error.mapper';
import { ErrorDictionary } from '../errors/error.dictionary';
import { AwsErrorCodes } from '../constants/aws-errors.constants';

@Injectable()
export class S3Client {
  async getObject(bucket: string, key: string): Promise<Buffer> {
    return awsError(
      async () => {
        const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const bytes = await response.Body!.transformToByteArray();
        return Buffer.from(bytes);
      },
      ErrorDictionary.S3_UNAVAILABLE,
      [{ code: AwsErrorCodes.S3_NO_SUCH_KEY, error: ErrorDictionary.S3_OBJECT_NOT_FOUND, context: key }],
    );
  }

  async putObject(bucket: string, key: string, body: string, contentType: string): Promise<void> {
    await awsError(
      () => s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })),
      ErrorDictionary.S3_UNAVAILABLE,
    );
  }

  async getSignedPutUrl(bucket: string, key: string, contentType: string, expiresIn: number): Promise<string> {
    return awsError(
      () => getSignedUrl(s3Client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn }),
      ErrorDictionary.S3_UNAVAILABLE,
    );
  }
}
