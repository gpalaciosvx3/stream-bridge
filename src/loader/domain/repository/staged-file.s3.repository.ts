import { StagedParsedFile } from '../types/staged-parsed-file.types';

export abstract class StagedFileS3Repository {
  abstract download(key: string): Promise<StagedParsedFile>;
}
