import { ValidationPolicy } from '../types/schema-record.types';
import { IValidationStrategy } from './strategies/validation.strategy';
import { StrictValidationStrategy } from './strategies/strict.validation-strategy';
import { LenientValidationStrategy } from './strategies/lenient.validation-strategy';

export class ValidationFactory {
  private static readonly strategyMap: Record<ValidationPolicy, IValidationStrategy> = {
    STRICT:  new StrictValidationStrategy(),
    LENIENT: new LenientValidationStrategy(),
  };

  static create(policy: ValidationPolicy): IValidationStrategy {
    return ValidationFactory.strategyMap[policy];
  }
}
