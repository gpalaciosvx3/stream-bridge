import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { JobStatus } from '../../../common/types/job-status.types';
import { ValidatorConstants } from '../constants/validator.constants';
import { ValidatorInput } from '../types/validator-input.types';
import { ValidatorOutput } from '../types/validator-output.types';
import { ValidationReportSummary } from '../types/validation-report.types';
import { ValidatedJobUpdate } from '../types/validated-job-update.types';

export class ValidationJobEntity {
  private constructor(
    public readonly clientId:  string,
    public readonly jobId:     string,
    public readonly stagedKey: string,
    public readonly checksum:  string,
    public readonly totalRows: number,
    public readonly reportKey: string,
  ) {}

  static build(input: ValidatorInput): ValidationJobEntity {
    ValidationJobEntity.validateInvariants(input);
    return new ValidationJobEntity(
      input.clientId,
      input.jobId,
      input.stagedKey,
      input.checksum,
      input.totalRows,
      `${ValidatorConstants.STAGED_KEY_PREFIX}/${input.jobId}/${ValidatorConstants.STAGED_REPORT_FILE}`,
    );
  }

  private static validateInvariants(input: ValidatorInput): void {
    if (!input.clientId?.trim())  throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'clientId requerido');
    if (!input.jobId?.trim())     throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'jobId requerido');
    if (!input.stagedKey?.trim()) throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'stagedKey requerido');
    if (!input.checksum?.trim())  throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'checksum requerido');
  }

  toUpdate(status: JobStatus.VALIDATED | JobStatus.VALIDATION_FAILED, validRows: number, invalidRows: number): ValidatedJobUpdate {
    return {
      status,
      validRows,
      invalidRows,
      updatedAt: new Date().toISOString(),
    };
  }

  toOutput(report: ValidationReportSummary): ValidatorOutput {
    return {
      clientId:         this.clientId,
      jobId:            this.jobId,
      stagedKey:        this.stagedKey,
      checksum:         this.checksum,
      validationReport: report,
    };
  }
}
