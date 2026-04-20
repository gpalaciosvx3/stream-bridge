import { ValidationReport } from '../types/validation-report.types';

export abstract class ReportS3Repository {
  abstract upload(key: string, report: ValidationReport): Promise<void>;
}
