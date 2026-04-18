import { PipelineTriggerEntity } from '../entities/pipeline-trigger.entity';

export abstract class PipelineSfnRepository {
  abstract startExecution(entity: PipelineTriggerEntity): Promise<boolean>;
}
