import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { S3EventNotification } from '../types/sqs-event.types';

const S3_KEY_SEGMENTS = { CLIENT_ID: 1, JOB_ID: 3 } as const;
const S3_KEY_MIN_PARTS = 5;

export class PipelineTriggerEntity {
  private constructor(
    public readonly bucket:   string,
    public readonly key:      string,
    public readonly clientId: string,
    public readonly jobId:    string,
  ) {}

  static build(rawBody: unknown): PipelineTriggerEntity {
    const notification = rawBody as S3EventNotification;
    const record = notification?.Records?.[0];

    PipelineTriggerEntity.validateInvariants(record);

    const bucket = record.s3.bucket.name;
    const key    = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const parts  = key.split('/');

    if (parts.length < S3_KEY_MIN_PARTS) {
      throw new CustomException(ErrorDictionary.INTERNAL_ERROR, `S3 key con formato inesperado: ${key}`);
    }

    return new PipelineTriggerEntity(
      bucket,
      key,
      parts[S3_KEY_SEGMENTS.CLIENT_ID],
      parts[S3_KEY_SEGMENTS.JOB_ID],
    );
  }

  private static validateInvariants(record: S3EventNotification['Records'][number] | undefined): void {
    if (!record?.s3?.bucket?.name || !record?.s3?.object?.key) {
      throw new CustomException(ErrorDictionary.INTERNAL_ERROR, 'S3 event notification inválido');
    }
  }
}
