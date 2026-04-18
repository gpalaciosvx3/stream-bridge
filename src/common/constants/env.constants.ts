export class EnvConstants {
  static readonly AWS_REGION        = 'AWS_REGION';
  static readonly S3_BUCKET         = 'S3_BUCKET';
  static readonly JOBS_TABLE        = 'JOBS_TABLE';
  static readonly STEP_FUNCTIONS_ARN = 'STEP_FUNCTIONS_ARN';

  static readonly REQUERIDAS_UPLOAD_REQUEST: readonly string[] = [
    EnvConstants.S3_BUCKET,
    EnvConstants.JOBS_TABLE,
  ];

  static readonly REQUERIDAS_PIPELINE_TRIGGER: readonly string[] = [
    EnvConstants.JOBS_TABLE,
    EnvConstants.STEP_FUNCTIONS_ARN,
  ];
}
