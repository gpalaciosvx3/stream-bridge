export type ValidationError = {
  row:     number;
  field:   string;
  message: string;
};

export type ValidationReport = {
  total:   number;
  valid:   number;
  invalid: number;
  errors:  ValidationError[];
  passed:  boolean;
};

export type ValidationReportSummary = Omit<ValidationReport, 'errors'>;
