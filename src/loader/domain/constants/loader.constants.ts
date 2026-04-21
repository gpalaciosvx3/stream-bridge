import { JobStatus } from '../../../common/types/job-status.types';

export class LoaderConstants {
  static readonly STAGED_KEY_PREFIX    = 'staging';
  static readonly STAGED_PARSED_FILE   = 'parsed.json';
  static readonly STAGED_REPORT_FILE   = 'validation-report.json';
  static readonly PROCESSED_KEY_PREFIX = 'processed';

  static readonly VALID_ENTRY_STATUSES: readonly JobStatus[] = [
    JobStatus.VALIDATED,
    JobStatus.FAILED,
    JobStatus.VALIDATION_FAILED,
  ];
}
