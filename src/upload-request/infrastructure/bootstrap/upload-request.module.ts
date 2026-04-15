import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { JobDbRepositoryImpl } from '../repository/job.db.repository.impl';
import { PresignedUrlS3Repository } from '../../domain/repository/presigned-url.s3.repository';
import { PresignedUrlS3RepositoryImpl } from '../repository/presigned-url.s3.repository.impl';
import { UploadRequestService } from '../../domain/service/upload-request.service';
import { CreateUploadRequestUseCase } from '../../application/use-cases/create-upload-request.usecase';
import { UploadRequestController } from '../controller/upload-request.controller';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_UPLOAD_REQUEST),
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    {
      provide: JobDbRepository,
      useFactory: (dynamo: DynamoClient) => new JobDbRepositoryImpl(dynamo, envConfig.jobsTable),
      inject: [DynamoClient],
    },
    {
      provide: PresignedUrlS3Repository,
      useFactory: () => new PresignedUrlS3RepositoryImpl(envConfig.s3Bucket),
    },
    {
      provide: UploadRequestService,
      useFactory: (jobRepo: JobDbRepository, presignedRepo: PresignedUrlS3Repository) =>
        new UploadRequestService(jobRepo, presignedRepo),
      inject: [JobDbRepository, PresignedUrlS3Repository],
    },
    {
      provide: CreateUploadRequestUseCase,
      useFactory: (svc: UploadRequestService) => new CreateUploadRequestUseCase(svc),
      inject: [UploadRequestService],
    },
    {
      provide: UploadRequestController,
      useFactory: (uc: CreateUploadRequestUseCase) => new UploadRequestController(uc),
      inject: [CreateUploadRequestUseCase],
    },
  ],
})
export class UploadRequestModule {}
