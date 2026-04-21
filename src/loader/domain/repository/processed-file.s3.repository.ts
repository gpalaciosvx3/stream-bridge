import { ProcessedFile } from '../types/processed-file.types';

export abstract class ProcessedFileS3Repository {
  abstract upload(key: string, content: ProcessedFile): Promise<void>;
}
