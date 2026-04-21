import { ValidationReportRecord } from '../types/validation-report-record.types';

export abstract class ReportS3Repository {
  abstract download(key: string): Promise<ValidationReportRecord>;
}
