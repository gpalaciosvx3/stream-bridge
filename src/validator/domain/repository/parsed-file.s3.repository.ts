import { StagedParsedFile } from '../types/staged-parsed-file.types';

export abstract class ParsedFileS3Repository {
  abstract download(key: string): Promise<StagedParsedFile>;
}
