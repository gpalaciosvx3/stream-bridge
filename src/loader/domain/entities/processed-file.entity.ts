import { LoadJobEntity } from './load-job.entity';
import { StagedParsedFile } from '../types/staged-parsed-file.types';
import { ValidationReportRecord } from '../types/validation-report-record.types';
import { ProcessedFile } from '../types/processed-file.types';

export class ProcessedFileEntity {
  private constructor(
    public readonly validRows:   Array<Record<string, unknown>>,
    public readonly invalidRows: Array<Record<string, unknown>>,
    public readonly jobId:       string,
    public readonly clientId:    string,
    public readonly checksum:    string,
    public readonly total:       number,
    public readonly valid:       number,
    public readonly invalid:     number,
  ) {}

  static build(
    entity:     LoadJobEntity,
    parsedFile: StagedParsedFile,
    report:     ValidationReportRecord,
  ): ProcessedFileEntity {
    const invalidRowNumbers = new Set(report.errors.map(e => e.row));
    const validRows         = parsedFile.rows.filter((_, i) => !invalidRowNumbers.has(i + 1));
    const invalidRows       = parsedFile.rows.filter((_, i) =>  invalidRowNumbers.has(i + 1));
    return new ProcessedFileEntity(
      validRows,
      invalidRows,
      entity.jobId,
      entity.clientId,
      entity.checksum,
      report.total,
      report.valid,
      report.invalid,
    );
  }

  toContent(): ProcessedFile {
    return {
      validRows:   this.validRows,
      invalidRows: this.invalidRows,
      meta: {
        jobId:       this.jobId,
        clientId:    this.clientId,
        checksum:    this.checksum,
        total:       this.total,
        valid:       this.valid,
        invalid:     this.invalid,
        processedAt: new Date().toISOString(),
      },
    };
  }
}
