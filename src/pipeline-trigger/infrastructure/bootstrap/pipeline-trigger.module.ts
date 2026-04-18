import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SfnClient } from '../../../common/sfn/sfn.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { JobDbRepositoryImpl } from '../repository/job.db.repository.impl';
import { PipelineSfnRepository } from '../../domain/repository/pipeline.sfn.repository';
import { PipelineSfnRepositoryImpl } from '../repository/pipeline.sfn.repository.impl';
import { PipelineTriggerService } from '../../domain/service/pipeline-trigger.service';
import { TriggerPipelineUseCase } from '../../application/use-cases/trigger-pipeline.usecase';
import { PipelineTriggerController } from '../controller/pipeline-trigger.controller';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_PIPELINE_TRIGGER),
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    { provide: SfnClient, useFactory: () => new SfnClient() },
    {
      provide: JobDbRepository,
      useFactory: (dynamo: DynamoClient) => new JobDbRepositoryImpl(dynamo, envConfig.jobsTable),
      inject: [DynamoClient],
    },
    {
      provide: PipelineSfnRepository,
      useFactory: (sfn: SfnClient) => new PipelineSfnRepositoryImpl(sfn, envConfig.stepFunctionsArn),
      inject: [SfnClient],
    },
    {
      provide: PipelineTriggerService,
      useFactory: (jobRepo: JobDbRepository, sfnRepo: PipelineSfnRepository) =>
        new PipelineTriggerService(jobRepo, sfnRepo),
      inject: [JobDbRepository, PipelineSfnRepository],
    },
    {
      provide: TriggerPipelineUseCase,
      useFactory: (svc: PipelineTriggerService) => new TriggerPipelineUseCase(svc),
      inject: [PipelineTriggerService],
    },
    {
      provide: PipelineTriggerController,
      useFactory: (uc: TriggerPipelineUseCase) => new PipelineTriggerController(uc),
      inject: [TriggerPipelineUseCase],
    },
  ],
})
export class PipelineTriggerModule {}
