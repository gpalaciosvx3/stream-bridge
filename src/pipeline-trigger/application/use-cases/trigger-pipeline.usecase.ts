import { Injectable, Logger } from '@nestjs/common';
import { PipelineTriggerService } from '../../domain/service/pipeline-trigger.service';
import { LogExecution } from '../../../common/decorator/log-execution.decorator';

@Injectable()
export class TriggerPipelineUseCase {
  private readonly logger = new Logger(TriggerPipelineUseCase.name);
  
  constructor(private readonly pipelineTriggerService: PipelineTriggerService) {}

  @LogExecution('PIPELINE-TRIGGER')
  async execute(raw: unknown): Promise<void> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    await this.pipelineTriggerService.trigger(raw);
  }
}
