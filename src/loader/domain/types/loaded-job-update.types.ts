import { JobStatus } from '../../../common/types/job-status.types';

export type LoadedJobUpdate = {
  status:       JobStatus.DONE;
  processedKey: string;
  completedAt:  string;
  duration:     number;
  updatedAt:    string;
};
