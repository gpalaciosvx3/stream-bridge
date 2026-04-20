import { JobStatus } from '../../../common/types/job-status.types';
import { ValidationFactory } from '../service/validation.factory';
import { SchemaRecord } from '../types/schema-record.types';
import { ValidationError, ValidationReport, ValidationReportSummary } from '../types/validation-report.types';

export class ValidationReportEntity {
  private constructor(
    public readonly total:   number,
    public readonly valid:   number,
    public readonly invalid: number,
    public readonly errors:  ValidationError[],
    public readonly passed:  boolean,
  ) {}

  static build(errors: ValidationError[], totalRows: number, schema: SchemaRecord): ValidationReportEntity {
    const valid  = totalRows - errors.length;
    const passed = ValidationFactory.create(schema.validationPolicy).evaluate(
      { total: totalRows, valid, invalid: errors.length, errors, passed: false },
      schema.errorThresholdPct,
    );
    return new ValidationReportEntity(totalRows, valid, errors.length, errors, passed);
  }

  toStatus(): JobStatus.VALIDATED | JobStatus.VALIDATION_FAILED {
    return this.passed ? JobStatus.VALIDATED : JobStatus.VALIDATION_FAILED;
  }

  toReport(): ValidationReport {
    return { total: this.total, valid: this.valid, invalid: this.invalid, errors: this.errors, passed: this.passed };
  }

  toSummary(): ValidationReportSummary {
    return { total: this.total, valid: this.valid, invalid: this.invalid, passed: this.passed };
  }
}
