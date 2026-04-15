import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary, InputError } from '../../../common/errors/error.dictionary';
import { JobStatus } from '../../../common/types/job-status.types';
import { UploadRequestConstants } from '../constants/upload-request.constants';

export class JobEntity {
  private constructor(
    public readonly jobId: string,
    public readonly clientId: string,
    public readonly status: JobStatus,
    public readonly sourceKey: string,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly expiresAt: number,
  ) {}

  static build(params: { clientId: string; filename: string; contentType: string }): JobEntity {
    JobEntity.validateInvariants(params);
    const jobId = crypto.randomUUID();
    const date = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    return new JobEntity(
      jobId,
      params.clientId,
      JobStatus.PENDING,
      `${UploadRequestConstants.S3_RAW_UPLOADS_PREFIX}/${params.clientId}/${date}/${jobId}/${params.filename}`,
      now,
      now,
      Math.floor(Date.now() / 1000) + UploadRequestConstants.PRESIGNED_URL_TTL_SECONDS,
    );
  }

  private static validateInvariants(params: { clientId: string; filename: string; contentType: string }): void {
    const rules: Array<[boolean, InputError]> = [
      [!params.clientId.trim(), ErrorDictionary.INVALID_CLIENT_ID],
      [params.filename.includes('../') || params.filename.includes('/'), ErrorDictionary.INVALID_FILENAME],
      [!(UploadRequestConstants.ALLOWED_CONTENT_TYPES as readonly string[]).includes(params.contentType), ErrorDictionary.INVALID_CONTENT_TYPE],
    ];
    rules
      .filter(([failed]) => failed)
      .slice(0, 1)
      .forEach(([, error]) => {
        throw new CustomException(error);
      });
  }
}
