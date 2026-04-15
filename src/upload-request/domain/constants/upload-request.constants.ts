export class UploadRequestConstants {
  static readonly PRESIGNED_URL_TTL_SECONDS = 900;
  static readonly S3_RAW_UPLOADS_PREFIX = 'raw-uploads';

  static readonly ALLOWED_CONTENT_TYPES = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/xml',
    'text/xml',
    'text/plain',
  ] as const;
}
