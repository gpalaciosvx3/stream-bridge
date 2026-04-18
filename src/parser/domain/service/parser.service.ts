import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { JobStatus } from '../../../common/types/job-status.types';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { RawFileS3Repository } from '../repository/raw-file.s3.repository';
import { StagedFileS3Repository } from '../repository/staged-file.s3.repository';
import { JobDbRepository } from '../repository/job.db.repository';
import { ParserFactory } from './parser.factory';
import { ParseInput } from '../types/parser-input.types';
import { ParseOutput } from '../types/parser-output.types';
import { ParserConstants } from '../constants/parser.constants';
import { ParseJobEntity } from '../entities/parse-job.entity';
import { ParsedFileEntity } from '../entities/parsed-file.entity';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  constructor(
    private readonly rawFileRepository:    RawFileS3Repository,
    private readonly stagedFileRepository: StagedFileS3Repository,
    private readonly jobDbRepository:      JobDbRepository,
  ) {}

  async parse(input: ParseInput): Promise<ParseOutput> {
    this.logger.log(`[PASO 1] Proceso de parseo iniciado para jobId: ${input.jobId} | cliente: ${input.clientId}`);
    const entity = ParseJobEntity.build(input);

    this.logger.log(`[PASO 2] Reconciliando estado del jobId: ${entity.jobId} antes de iniciar el proceso de parseo`);
    await this.reconcileStatus(entity.jobId);

    this.logger.log(`[PASO 3] Descargando archivo raw desde S3 => bucket: ${entity.bucket} | key: ${entity.key}`);
    const buffer = await this.rawFileRepository.download(entity.bucket, entity.key);

    this.logger.log('[PASO 4] Detectando formato del archivo y parseando contenido');
    const format   = ParserFactory.detectFormat(entity.key);
    const strategy = ParserFactory.create(format);
    const rows     = strategy.parse(buffer);

    this.logger.log('[PASO 5] Validando que el archivo no esté vacío después del parseo');
    this.assertNotEmpty(rows, entity.key);

    this.logger.log('[PASO 6] Construyendo metadata del archivo y subiendo resultado parseado a S3');
    const { checksum, fileSizeKb } = this.buildFileMetadata(buffer);

    this.logger.log(`[PASO 7] Parseando documento a JSON => totalRows: ${rows.length} | fileSizeKb: ${fileSizeKb} | checksum: ${checksum}`);
    const parsedFile = ParsedFileEntity.build(rows, format).toFile();

    this.logger.log(`[PASO 8] Subiendo archivo parseado a S3 => bucket: ${entity.bucket} | key: ${entity.stagedKey}`);
    await this.stagedFileRepository.upload(entity.bucket, entity.stagedKey, parsedFile);

    this.logger.log('[PASO 9] Actualizando estado del job a PARSED con metadata del archivo');
    await this.jobDbRepository.transitionToParsed(entity.jobId, {
      totalRows: rows.length,
      fileSizeKb,
      sourceFormat: format,
      checksum,
      stagedKey: entity.stagedKey,
    });

    return entity.toOutput(checksum, rows.length);
  }

  private buildFileMetadata(buffer: Buffer): { checksum: string; fileSizeKb: number } {
    return {
      checksum:   createHash(ParserConstants.CHECKSUM_ALGORITHM).update(buffer).digest('hex'),
      fileSizeKb: Math.ceil(buffer.length / ParserConstants.BYTES_PER_KB),
    };
  }

  private assertNotEmpty(rows: Array<Record<string, unknown>>, key: string): void {
    if (rows.length === 0) throw new CustomException(ErrorDictionary.EMPTY_FILE, key);
  }

  private async reconcileStatus(jobId: string): Promise<void> {
    const job = await this.jobDbRepository.getById(jobId);
    if (!job) throw new CustomException(ErrorDictionary.JOB_NOT_FOUND);
    if (job.status === JobStatus.PENDING) {
      this.logger.warn(`Job ${jobId} encontrado en estado PENDING, se actualiza a PROCESSING para reconciliación antes de parsear`);
      await this.jobDbRepository.transitionToProcessing(jobId);
    }
  }
}
