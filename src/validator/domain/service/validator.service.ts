import { z } from 'zod';
import { Injectable, Logger } from '@nestjs/common';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { ValidatorConstants } from '../constants/validator.constants';
import { ParsedFileS3Repository } from '../repository/parsed-file.s3.repository';
import { ReportS3Repository } from '../repository/report.s3.repository';
import { SchemaDbRepository } from '../repository/schema.db.repository';
import { JobDbRepository } from '../repository/job.db.repository';
import { ValidationJobEntity } from '../entities/validation-job.entity';
import { ValidationReportEntity } from '../entities/validation-report.entity';
import { ZodSchemaBuilder } from './zod-schema.builder';
import { ZodMessageMapper } from './zod-message.mapper';
import { ValidatorInput } from '../types/validator-input.types';
import { ValidatorOutput } from '../types/validator-output.types';
import { ValidationError } from '../types/validation-report.types';
import { SchemaRecord } from '../types/schema-record.types';
import { JobRecord } from '../types/job-record.types';

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name);

  constructor(
    private readonly parsedFileRepository: ParsedFileS3Repository,
    private readonly reportRepository:     ReportS3Repository,
    private readonly schemaRepository:     SchemaDbRepository,
    private readonly jobDbRepository:      JobDbRepository,
  ) {}

  async validate(input: ValidatorInput): Promise<ValidatorOutput> {
    this.logger.log(`[PASO 1] Construyendo entidad para jobId: ${input.jobId}`);
    const entity = ValidationJobEntity.build(input);

    this.logger.log(`[PASO 2] Validando precondiciones para jobId: ${entity.jobId} | cliente: ${entity.clientId}`);
    const schemaRecord = await this.assertPreconditions(entity);

    this.logger.log(`[PASO 3] Descargando archivo parseado desde S3 => key: ${entity.stagedKey}`);
    const parsedFile = await this.parsedFileRepository.download(entity.stagedKey);

    this.logger.log('Archivo parseado', JSON.stringify(parsedFile));

    this.logger.log(`[PASO 4] Construyendo schema Zod => versión: ${schemaRecord.schemaVersion} | política: ${schemaRecord.validationPolicy}`);
    const zodSchema = ZodSchemaBuilder.build(schemaRecord.zodSchema);

    this.logger.log(`[PASO 5] Validando ${parsedFile.rows.length} filas contra el schema`);
    const errors = this.validateRows(parsedFile.rows, zodSchema);

    this.logger.log(`[PASO 6] Construyendo reporte de validación => total: ${parsedFile.rows.length} | errores encontrados: ${errors.length}`);
    const report = ValidationReportEntity.build(errors, parsedFile.rows.length, schemaRecord);

    this.logger.log('[PASO 7] Subiendo reporte de validación', JSON.stringify(report.toReport()));
    await this.reportRepository.upload(entity.reportKey, report.toReport());

    this.logger.log(`[PASO 8] Actualizando estado del job => ${report.toStatus()}`);
    await this.jobDbRepository.updateValidationResult(entity.jobId, entity.toUpdate(report.toStatus(), report.valid, report.invalid));

    if (!report.passed) throw new CustomException(ErrorDictionary.VALIDATION_FAILED, `jobId: ${entity.jobId} | inválidas: ${report.invalid}/${report.total}`);

    return entity.toOutput(report.toSummary());
  }

  private async assertPreconditions(entity: ValidationJobEntity): Promise<SchemaRecord> {
    const [job, schemaRecord] = await Promise.all([
      this.jobDbRepository.getById(entity.jobId),
      this.schemaRepository.findActiveByClientId(entity.clientId),
    ]);
    this.assertJobExists(job, entity.jobId);
    this.assertJobStatus(job, entity.jobId);
    this.assertSchemaExists(schemaRecord, entity.clientId);
    return schemaRecord;
  }

  private assertJobExists(job: JobRecord | null, jobId: string): asserts job is JobRecord {
    if (!job) throw new CustomException(ErrorDictionary.JOB_NOT_FOUND, jobId);
  }

  private assertJobStatus(job: JobRecord, jobId: string): void {
    const isValid = (ValidatorConstants.VALID_ENTRY_STATUSES as string[]).includes(job.status);
    if (!isValid) throw new CustomException(ErrorDictionary.INVALID_JOB_STATUS, `jobId: ${jobId} | status actual: ${job.status}`);
  }

  private assertSchemaExists(schema: SchemaRecord | null, clientId: string): asserts schema is SchemaRecord {
    if (!schema) throw new CustomException(ErrorDictionary.SCHEMA_NOT_FOUND, clientId);
  }

  private validateRows(
    rows:      Array<Record<string, unknown>>,
    zodSchema: z.ZodObject<z.ZodRawShape>,
  ): ValidationError[] {
    return rows.flatMap((row, index) => this.validateRow(row, index + 1, zodSchema));
  }

  private validateRow(
    row:       Record<string, unknown>,
    rowNumber: number,
    zodSchema: z.ZodObject<z.ZodRawShape>,
  ): ValidationError[] {
    const result = zodSchema.safeParse(row);
    if (result.success) return [];
    return result.error.errors.map(e => ({
      row:     rowNumber,
      field:   e.path.length > 0 ? e.path.join('.') : '(fila)',
      value:   e.path.length > 0 ? row[e.path[0] as string] : row,
      message: ZodMessageMapper.translate(e),
    }));
  }
}
