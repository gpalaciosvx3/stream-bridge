import { S3Client } from '@aws-sdk/client-s3';
import { envConfig } from '../config/env.config';

export const s3Client = new S3Client({ region: envConfig.awsRegion });
