import { ValidationReport } from '../../types/validation-report.types';
import { IValidationStrategy } from './validation.strategy';

export class StrictValidationStrategy implements IValidationStrategy {
  evaluate(report: ValidationReport): boolean {
    return report.invalid === 0;
  }
}
