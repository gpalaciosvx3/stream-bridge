import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SFNClient } from '@aws-sdk/client-sfn';
import { envConfig } from './env.config';

export const dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: envConfig.awsRegion }));
export const s3Client       = new S3Client({ region: envConfig.awsRegion });
export const sfnClient      = new SFNClient({ region: envConfig.awsRegion });
