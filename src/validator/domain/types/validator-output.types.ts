import { ValidationReportSummary } from './validation-report.types';

export type ValidatorOutput = {
  clientId:         string;
  jobId:            string;
  stagedKey:        string;
  checksum:         string;
  validationReport: ValidationReportSummary;
};
