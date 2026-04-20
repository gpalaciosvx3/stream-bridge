import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { ParserConstants } from '../constants/parser.constants';
import { ParseInput } from '../types/parser-input.types';
import { ParseOutput } from '../types/parser-output.types';
import { ParsedJobUpdate } from '../types/parsed-job-update.types';
import { ParserFormat } from '../types/parser-format.types';

export class ParseJobEntity {
  private constructor(
    public readonly clientId:  string,
    public readonly jobId:     string,
    public readonly bucket:    string,
    public readonly key:       string,
    public readonly stagedKey: string,
  ) {}

  static build(input: ParseInput): ParseJobEntity {
    ParseJobEntity.validateInvariants(input);
    return new ParseJobEntity(
      input.clientId,
      input.jobId,
      input.bucket,
      input.key,
      `${ParserConstants.STAGED_KEY_PREFIX}/${input.jobId}/${ParserConstants.STAGED_PARSED_FILE}`,
    );
  }

  private static validateInvariants(input: ParseInput): void {
    if (!input.clientId?.trim()) throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'clientId requerido');
    if (!input.jobId?.trim())   throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'jobId requerido');
    if (!input.bucket?.trim())  throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'bucket requerido');
    if (!input.key?.trim())     throw new CustomException(ErrorDictionary.INVALID_STEP_FN_INPUT, 'key requerido');
  }

  toUpdate(checksum: string, totalRows: number, fileSizeKb: number, sourceFormat: ParserFormat): ParsedJobUpdate {
    return {
      totalRows,
      fileSizeKb,
      sourceFormat,
      checksum,
      stagedKey: this.stagedKey,
      updatedAt: new Date().toISOString(),
    };
  }

  toOutput(checksum: string, totalRows: number): ParseOutput {
    return {
      clientId:  this.clientId,
      jobId:     this.jobId,
      stagedKey: this.stagedKey,
      checksum,
      totalRows,
    };
  }
}
