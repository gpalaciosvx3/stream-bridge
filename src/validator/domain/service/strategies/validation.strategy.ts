import { ValidationReport } from '../../types/validation-report.types';

export interface IValidationStrategy {
  evaluate(report: ValidationReport, thresholdPct?: number): boolean;
}
