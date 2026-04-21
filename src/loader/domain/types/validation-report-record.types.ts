export type ValidationReportRecord = {
  total:   number;
  valid:   number;
  invalid: number;
  errors:  Array<{ row: number }>;
  passed:  boolean;
};
