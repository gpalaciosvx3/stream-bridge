import { ParsedFile } from '../types/parsed-file.types';

export abstract class StagedFileS3Repository {
  abstract upload(bucket: string, key: string, content: ParsedFile): Promise<void>;
}
