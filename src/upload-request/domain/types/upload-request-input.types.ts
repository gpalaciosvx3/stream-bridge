import { AllowedContentType } from './job.types';

export type UploadRequestInput = {
  clientId:    string;
  filename:    string;
  contentType: AllowedContentType;
};
