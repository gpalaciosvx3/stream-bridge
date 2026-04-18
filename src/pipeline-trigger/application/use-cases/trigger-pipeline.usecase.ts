import { Injectable } from '@nestjs/common';
import { PipelineTriggerService } from '../../domain/service/pipeline-trigger.service';
import { LogExecution } from '../../../common/decorator/log-execution.decorator';

@Injectable()
export class TriggerPipelineUseCase {
  constructor(private readonly pipelineTriggerService: PipelineTriggerService) {}

  @LogExecution('PIPELINE-TRIGGER')
  async execute(rawBody: unknown): Promise<void> {
    await this.pipelineTriggerService.trigger(rawBody);
  }
}
