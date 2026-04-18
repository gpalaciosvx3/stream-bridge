import { Injectable } from '@nestjs/common';
import { TriggerPipelineUseCase } from '../../application/use-cases/trigger-pipeline.usecase';
import { SqsMessage } from '../../../common/middleware/types/lambda-event.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class PipelineTriggerController {
  constructor(private readonly useCase: TriggerPipelineUseCase) {}

  @HandleExecution('PIPELINE-TRIGGER')
  async handle(record: SqsMessage): Promise<void> {
    await this.useCase.execute(record.body);
  }
}
