import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { s3Client } from '../config/aws.config';
import { CustomException } from '../errors/custom.exception';
import { ErrorDictionary } from '../errors/error.dictionary';

@Injectable()
export class S3Client {
  async getObject(bucket: string, key: string): Promise<Buffer> {
    try {
      const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as Readable) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
        throw new CustomException(ErrorDictionary.S3_OBJECT_NOT_FOUND, key);
      }
      throw new CustomException(ErrorDictionary.INTERNAL_ERROR, `S3 GetObject fallido: ${key}`);
    }
  }

  async putObject(bucket: string, key: string, body: string, contentType: string): Promise<void> {
    try {
      await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
    } catch {
      throw new CustomException(ErrorDictionary.INTERNAL_ERROR, `S3 PutObject fallido: ${key}`);
    }
  }

  async getSignedPutUrl(bucket: string, key: string, contentType: string, expiresIn: number): Promise<string> {
    try {
      const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch {
      throw new CustomException(ErrorDictionary.INTERNAL_ERROR, `S3 presigned URL fallida: ${key}`);
    }
  }
}
