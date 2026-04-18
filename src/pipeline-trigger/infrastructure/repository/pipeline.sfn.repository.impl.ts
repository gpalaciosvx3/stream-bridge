import { Injectable } from '@nestjs/common';
import { SfnClient } from '../../../common/sfn/sfn.client';
import { PipelineSfnRepository } from '../../domain/repository/pipeline.sfn.repository';
import { PipelineTriggerEntity } from '../../domain/entities/pipeline-trigger.entity';

@Injectable()
export class PipelineSfnRepositoryImpl extends PipelineSfnRepository {
  constructor(
    private readonly sfnClient: SfnClient,
    private readonly stateMachineArn: string,
  ) {
    super();
  }

  async startExecution(entity: PipelineTriggerEntity): Promise<boolean> {
    return this.sfnClient.startExecution(
      this.stateMachineArn,
      entity.jobId,
      JSON.stringify({ bucket: entity.bucket, key: entity.key, clientId: entity.clientId, jobId: entity.jobId }),
    );
  }
}
