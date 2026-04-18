import { NamingConstants } from './naming.constants';

export class ResourceConstants {
  static readonly LAMBDA_UPLOAD_REQUEST    = NamingConstants.LMB_001;
  static readonly LAMBDA_PIPELINE_TRIGGER  = NamingConstants.LMB_002;
  static readonly JOBS_TABLE               = NamingConstants.DDB_001;
  static readonly SCHEMAS_TABLE            = NamingConstants.DDB_002;
  static readonly PIPELINE_BUCKET         = NamingConstants.S3_001;
  static readonly API_INGESTION            = NamingConstants.APG_001;
  static readonly FILE_INGESTION_QUEUE     = NamingConstants.SQS_001;
  static readonly FILE_INGESTION_DLQ       = NamingConstants.SQS_002;
  static readonly STATE_MACHINE            = NamingConstants.SFN_001;
  static readonly UPLOAD_REQUEST_ROLE      = NamingConstants.ROL_001;
  static readonly PIPELINE_TRIGGER_ROLE    = NamingConstants.ROL_002;
  static readonly SFN_EXECUTION_ROLE       = NamingConstants.ROL_006;
}
