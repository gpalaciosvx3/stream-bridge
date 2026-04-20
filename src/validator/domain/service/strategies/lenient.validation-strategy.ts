import { ValidationReport } from '../../types/validation-report.types';
import { IValidationStrategy } from './validation.strategy';

export class LenientValidationStrategy implements IValidationStrategy {
  evaluate(report: ValidationReport, thresholdPct: number): boolean {
    return (report.invalid / report.total) * 100 <= thresholdPct;
  }
}
