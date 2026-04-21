import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { S3Client } from '../../../common/s3/s3.client';
import { StagedFileS3Repository } from '../../domain/repository/staged-file.s3.repository';
import { ReportS3Repository } from '../../domain/repository/report.s3.repository';
import { ProcessedFileS3Repository } from '../../domain/repository/processed-file.s3.repository';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { StagedFileS3RepositoryImpl } from '../repository/staged-file.s3.repository.impl';
import { ReportS3RepositoryImpl } from '../repository/report.s3.repository.impl';
import { ProcessedFileS3RepositoryImpl } from '../repository/processed-file.s3.repository.impl';
import { JobDbRepositoryImpl } from '../repository/job.db.repository.impl';
import { LoaderService } from '../../domain/service/loader.service';
import { LoadFileUseCase } from '../../application/use-cases/load-file.usecase';
import { LoaderController } from '../controller/loader.controller';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_LOADER),
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    { provide: S3Client,     useFactory: () => new S3Client() },
    {
      provide:    StagedFileS3Repository,
      useFactory: (s3: S3Client) => new StagedFileS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject:     [S3Client],
    },
    {
      provide:    ReportS3Repository,
      useFactory: (s3: S3Client) => new ReportS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject:     [S3Client],
    },
    {
      provide:    ProcessedFileS3Repository,
      useFactory: (s3: S3Client) => new ProcessedFileS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject:     [S3Client],
    },
    {
      provide:    JobDbRepository,
      useFactory: (dynamo: DynamoClient) => new JobDbRepositoryImpl(dynamo, envConfig.jobsTable),
      inject:     [DynamoClient],
    },
    {
      provide:    LoaderService,
      useFactory: (
        staged:    StagedFileS3Repository,
        report:    ReportS3Repository,
        processed: ProcessedFileS3Repository,
        job:       JobDbRepository,
      ) => new LoaderService(staged, report, processed, job),
      inject: [StagedFileS3Repository, ReportS3Repository, ProcessedFileS3Repository, JobDbRepository],
    },
    {
      provide:    LoadFileUseCase,
      useFactory: (svc: LoaderService) => new LoadFileUseCase(svc),
      inject:     [LoaderService],
    },
    {
      provide:    LoaderController,
      useFactory: (uc: LoadFileUseCase) => new LoaderController(uc),
      inject:     [LoadFileUseCase],
    },
  ],
})
export class LoaderModule {}
