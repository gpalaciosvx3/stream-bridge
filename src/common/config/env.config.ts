import { EnvConstants } from '../constants/env.constants';

export const envConfig = {
  isLambda:         !!process.env['AWS_LAMBDA_FUNCTION_NAME'],
  awsRegion:        process.env[EnvConstants.AWS_REGION]          ?? 'us-east-1',
  s3Bucket:         process.env[EnvConstants.S3_BUCKET]          ?? '',
  jobsTable:        process.env[EnvConstants.JOBS_TABLE]         ?? '',
  stepFunctionsArn: process.env[EnvConstants.STEP_FUNCTIONS_ARN] ?? '',
};
