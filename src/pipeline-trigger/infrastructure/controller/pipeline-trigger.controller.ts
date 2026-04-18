import { Injectable, Logger } from '@nestjs/common';
import { TriggerPipelineUseCase } from '../../application/use-cases/trigger-pipeline.usecase';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';

@Injectable()
export class PipelineTriggerController {
  private readonly logger = new Logger(PipelineTriggerController.name);

  constructor(private readonly useCase: TriggerPipelineUseCase) {}

  async handle(record: SqsMessage): Promise<void> {
    try {
      await this.useCase.execute(record.body);
    } catch (error) {
      this.logger.error('Error en pipeline-trigger', error);
      throw error;
    }
  }
}
