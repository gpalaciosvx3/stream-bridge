import { Injectable, Logger } from '@nestjs/common';
import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { JobStatus } from '../../../common/types/job-status.types';
import { LoaderConstants } from '../constants/loader.constants';
import { LoadJobEntity } from '../entities/load-job.entity';
import { ProcessedFileEntity } from '../entities/processed-file.entity';
import { StagedFileS3Repository } from '../repository/staged-file.s3.repository';
import { ReportS3Repository } from '../repository/report.s3.repository';
import { ProcessedFileS3Repository } from '../repository/processed-file.s3.repository';
import { JobDbRepository } from '../repository/job.db.repository';
import { LoaderInput } from '../types/loader-input.types';
import { LoaderOutput } from '../types/loader-output.types';
import { JobRecord } from '../types/job-record.types';

@Injectable()
export class LoaderService {
  private readonly logger = new Logger(LoaderService.name);

  constructor(
    private readonly stagedFileRepository:    StagedFileS3Repository,
    private readonly reportRepository:        ReportS3Repository,
    private readonly processedFileRepository: ProcessedFileS3Repository,
    private readonly jobDbRepository:         JobDbRepository,
  ) {}

  async load(input: LoaderInput): Promise<LoaderOutput> {
    this.logger.log(`[PASO 1] Construyendo entidad para jobId: ${input.jobId}`);
    const entity = LoadJobEntity.build(input);

    this.logger.log(`[PASO 2] Verificando existencia del job: ${entity.jobId}`);
    const job = await this.jobDbRepository.getById(entity.jobId);
    this.assertJobExists(job, entity.jobId);

    this.logger.log(`[PASO 2] Verificando idempotencia para jobId: ${entity.jobId} | checksum: ${entity.checksum}`);
    const idempotentOutput = this.resolveIdempotency(job, entity);
    if (idempotentOutput) return idempotentOutput;

    this.logger.log(`[PASO 2] Verificando status del job: ${entity.jobId}`);
    this.assertJobStatus(job, entity.jobId);

    this.logger.log(`[PASO 3] Descargando archivo parseado desde S3 => key: ${entity.stagedKey}`);
    const parsedFile = await this.stagedFileRepository.download(entity.stagedKey);

    this.logger.log('Archivo parseado', JSON.stringify(parsedFile));

    this.logger.log(`[PASO 4] Descargando reporte de validación desde S3 => key: ${entity.reportKey}`);
    const report = await this.reportRepository.download(entity.reportKey);

    this.logger.log('Reporte de validación', JSON.stringify(report));

    this.logger.log(`[PASO 5] Construyendo archivo procesado => válidas: ${report.valid} | inválidas: ${report.invalid}`);
    const processedFile = ProcessedFileEntity.build(entity, parsedFile, report);

    this.logger.log('Archivo procesado', JSON.stringify(processedFile.toContent()));

    this.logger.log(`[PASO 6] Subiendo archivo procesado => key: ${entity.processedKey}`);
    await this.processedFileRepository.upload(entity.processedKey, processedFile.toContent());

    this.logger.log('[PASO 7] Actualizando estado del job => DONE');
    await this.jobDbRepository.updateLoadResult(entity.jobId, entity.toUpdate(job.createdAt));

    return entity.toOutput();
  }


  private resolveIdempotency(job: JobRecord, entity: LoadJobEntity): LoaderOutput | null {
    if (!this.isAlreadyProcessed(job, entity.checksum)) return null;
    this.logger.warn('Job ya procesado con mismo checksum — skip idempotente');
    return entity.toOutput();
  }

  private isAlreadyProcessed(job: JobRecord, checksum: string): boolean {
    return job.status === JobStatus.DONE && job.checksum === checksum;
  }

  private assertJobExists(job: JobRecord | null, jobId: string): asserts job is JobRecord {
    if (!job) throw new CustomException(ErrorDictionary.JOB_NOT_FOUND, jobId);
  }

  private assertJobStatus(job: JobRecord, jobId: string): void {
    const isValid = (LoaderConstants.VALID_ENTRY_STATUSES as string[]).includes(job.status);
    if (!isValid) throw new CustomException(ErrorDictionary.INVALID_JOB_STATUS, `jobId: ${jobId} | status actual: ${job.status}`);
  }
}
