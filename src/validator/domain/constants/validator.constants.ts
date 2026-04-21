import { JobStatus } from '../../../common/types/job-status.types';

export class ValidatorConstants {
  static readonly STAGED_KEY_PREFIX  = 'staging';
  static readonly STAGED_REPORT_FILE = 'validation-report.json';

  static readonly VALID_ENTRY_STATUSES: readonly JobStatus[] = [
    JobStatus.PARSED,
    JobStatus.FAILED,
    JobStatus.VALIDATION_FAILED,
  ];

  static readonly ZOD_MSG_INVALID_TYPE    = (expected: string, received: string) => `Se esperaba ${expected}, se recibió ${received}`;
  static readonly ZOD_MSG_TOO_SMALL       = (minimum: number | bigint) => `El valor es menor al mínimo permitido (${minimum})`;
  static readonly ZOD_MSG_TOO_BIG         = (maximum: number | bigint) => `El valor supera el máximo permitido (${maximum})`;
  static readonly ZOD_MSG_INVALID_STRING  = 'El formato del campo no es válido';
  static readonly ZOD_MSG_INVALID_ENUM    = (options: (string | number)[]) => `Valor no permitido. Opciones válidas: ${options.join(', ')}`;
}
