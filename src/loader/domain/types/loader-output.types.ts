import { JobStatus } from '../../../common/types/job-status.types';

export type LoaderOutput = {
  jobId:        string;
  status:       JobStatus.DONE;
  processedKey: string;
};
