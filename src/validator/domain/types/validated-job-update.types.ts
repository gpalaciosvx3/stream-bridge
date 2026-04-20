import { JobStatus } from '../../../common/types/job-status.types';

export type ValidatedJobUpdate = {
  status:      JobStatus.VALIDATED | JobStatus.VALIDATION_FAILED;
  validRows:   number;
  invalidRows: number;
  updatedAt:   string;
};
