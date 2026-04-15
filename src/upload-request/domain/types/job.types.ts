import { UploadRequestConstants } from '../constants/upload-request.constants';

export type AllowedContentType = (typeof UploadRequestConstants.ALLOWED_CONTENT_TYPES)[number];
