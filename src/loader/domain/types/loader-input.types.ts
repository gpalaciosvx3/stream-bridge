type ValidationReportSummary = {
  total:   number;
  valid:   number;
  invalid: number;
  passed:  boolean;
};

export type LoaderInput = {
  clientId:         string;
  jobId:            string;
  stagedKey:        string;
  checksum:         string;
  validationReport: ValidationReportSummary;
};
