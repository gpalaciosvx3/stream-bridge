import { ResourceConstants } from './resource.constants';

export class InfraConstants {
  static readonly LAMBDA_TIMEOUT_DEFAULT_SECONDS = 30;
  static readonly LAMBDA_MEMORY_DEFAULT_MB       = 256;

  static readonly S3_RAW_FOLDER     = 'raw-uploads/';
  static readonly S3_STAGING_FOLDER = 'staging/';

  static readonly LOCAL_REGION     = 'us-east-1';
  static readonly LOCAL_ACCOUNT_ID = '000000000000';

  static readonly STATE_MACHINE_ARN = `arn:aws:states:${InfraConstants.LOCAL_REGION}:${InfraConstants.LOCAL_ACCOUNT_ID}:stateMachine:${ResourceConstants.STATE_MACHINE}`;
}
