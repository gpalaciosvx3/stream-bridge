import { JobStatus } from '../../../common/types/job-status.types';

export class ValidatorConstants {
  static readonly STAGED_KEY_PREFIX  = 'staging';
  static readonly STAGED_REPORT_FILE = 'validation-report.json';
  static readonly VALID_ENTRY_STATUS = JobStatus.PARSED;
}
