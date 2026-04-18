import { Injectable, Logger } from '@nestjs/common';
import { JobDbRepository } from '../repository/job.db.repository';
import { PipelineSfnRepository } from '../repository/pipeline.sfn.repository';
import { PipelineTriggerEntity } from '../entities/pipeline-trigger.entity';
import { JobStatus } from '../../../common/types/job-status.types';

@Injectable()
export class PipelineTriggerService {
  private readonly logger = new Logger(PipelineTriggerService.name);

  constructor(
    private readonly jobDbRepository: JobDbRepository,
    private readonly pipelineSfnRepository: PipelineSfnRepository,
  ) {}

  async trigger(rawBody: unknown): Promise<void> {
    this.logger.log(`[PASO 1] Validando input del body => ${JSON.stringify(rawBody).slice(0, 100)}...`);
    if (this.isTestEvent(rawBody)) return;
    const entity = PipelineTriggerEntity.build(rawBody);

    this.logger.log(`[PASO 2] Consultando job => ${entity.jobId}`);
    const job = await this.jobDbRepository.getById(entity.jobId);

    this.logger.log('[PASO 3] Verificando si se debe procesar el job');
    if (this.shouldSkip(job, entity.jobId)) return;

    this.logger.log(`[PASO 4] Iniciando ejecución Step Functions => ${entity.jobId}`);
    const started = await this.pipelineSfnRepository.startExecution(entity);

    this.logger.log('[PASO 5] Verificando idempotencia de ejecución en Step Functions');
    if (this.isExecutionDuplicated(started, entity.jobId)) return;

    this.logger.log(`[PASO 6] Actualizando job a PROCESSING => ${entity.jobId}`);
    await this.jobDbRepository.transitionToProcessing(entity.jobId);
  }

  private isTestEvent(rawBody: unknown): boolean {
    if (PipelineTriggerEntity.isTestEvent(rawBody)) {
      this.logger.log('Evento de prueba S3 detectado, se omite sin error');
      return true;
    }
    return false;
  }

  private isExecutionDuplicated(started: boolean, jobId: string): boolean {
    if (!started) {
      this.logger.warn(`Ejecución ya existente en Step Functions (idempotencia) => ${jobId}`);
      return true;
    }
    return false;
  }

  private shouldSkip(job: Awaited<ReturnType<JobDbRepository['getById']>>, jobId: string): boolean {
    if (!job) {
      this.logger.warn(`Job no encontrado, posiblemente expirado por TTL => ${jobId}`);
      return true;
    }

    if (job.status !== JobStatus.PENDING) {
      this.logger.log(`Idempotencia: job ${jobId} ya tiene status ${job.status}, se omite`);
      return true;
    }

    return false;
  }
}
