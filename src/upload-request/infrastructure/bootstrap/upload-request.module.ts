import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { S3Client } from '../../../common/s3/s3.client';
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
    { provide: S3Client,     useFactory: () => new S3Client() },
    {
      provide: JobDbRepository,
      useFactory: (dynamo: DynamoClient) => new JobDbRepositoryImpl(dynamo, envConfig.jobsTable),
      inject: [DynamoClient],
    },
    {
      provide: PresignedUrlS3Repository,
      useFactory: (s3: S3Client) => new PresignedUrlS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject: [S3Client],
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
