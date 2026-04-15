import { NamingConstants } from './naming.constants';

export class ResourceConstants {
  static readonly LAMBDA_UPLOAD_REQUEST      = NamingConstants.LMB_001;
  static readonly JOBS_TABLE                 = NamingConstants.DDB_001;
  static readonly PIPELINE_BUCKET            = NamingConstants.S3_001;
  static readonly API_INGESTION              = NamingConstants.APG_001;
  static readonly UPLOAD_REQUEST_ROLE        = NamingConstants.ROL_001;
}
