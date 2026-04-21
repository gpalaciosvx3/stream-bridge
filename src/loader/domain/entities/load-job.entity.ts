import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { JobStatus } from '../../../common/types/job-status.types';
import { LoaderConstants } from '../constants/loader.constants';
import { LoaderInput } from '../types/loader-input.types';
import { LoaderOutput } from '../types/loader-output.types';
import { LoadedJobUpdate } from '../types/loaded-job-update.types';

export class LoadJobEntity {
  private constructor(
    public readonly clientId:     string,
    public readonly jobId:        string,
    public readonly stagedKey:    string,
    public readonly reportKey:    string,
    public readonly checksum:     string,
    public readonly processedKey: string,
  ) {}

  static build(input: LoaderInput): LoadJobEntity {
    LoadJobEntity.validateInvariants(input);
    const now  = new Date();
    const yyyy = now.getFullYear();
    const mm   = String(now.getMonth() + 1).padStart(2, '0');
    const dd   = String(now.getDate()).padStart(2, '0');
    return new LoadJobEntity(
      input.clientId,
      input.jobId,
      input.stagedKey,
      `${LoaderConstants.STAGED_KEY_PREFIX}/${input.jobId}/${LoaderConstants.STAGED_REPORT_FILE}`,
      input.checksum,
      `${LoaderConstants.PROCESSED_KEY_PREFIX}/${input.clientId}/${yyyy}/${mm}/${dd}/${input.jobId}.json`,
    );
  }

  private static validateInvariants(input: LoaderInput): void {
    if (!input.clientId?.trim())  throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'clientId requerido');
    if (!input.jobId?.trim())     throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'jobId requerido');
    if (!input.stagedKey?.trim()) throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'stagedKey requerido');
    if (!input.checksum?.trim())  throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'checksum requerido');
  }

  toUpdate(createdAt: string): LoadedJobUpdate {
    const completedAt = new Date().toISOString();
    const duration    = Date.now() - new Date(createdAt).getTime();
    return {
      status:       JobStatus.DONE,
      processedKey: this.processedKey,
      completedAt,
      duration,
      updatedAt:    completedAt,
    };
  }

  toOutput(): LoaderOutput {
    return {
      jobId:        this.jobId,
      status:       JobStatus.DONE,
      processedKey: this.processedKey,
    };
  }
}
