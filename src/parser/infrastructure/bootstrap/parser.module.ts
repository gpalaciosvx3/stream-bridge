import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { S3Client } from '../../../common/s3/s3.client';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { RawFileS3Repository } from '../../domain/repository/raw-file.s3.repository';
import { StagedFileS3Repository } from '../../domain/repository/staged-file.s3.repository';
import { JobDbRepositoryImpl } from '../repository/job.db.repository.impl';
import { RawFileS3RepositoryImpl } from '../repository/raw-file.s3.repository.impl';
import { StagedFileS3RepositoryImpl } from '../repository/staged-file.s3.repository.impl';
import { ParserService } from '../../domain/service/parser.service';
import { ParseFileUseCase } from '../../application/use-cases/parse-file.usecase';
import { ParserController } from '../controller/parser.controller';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_PARSER),
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    { provide: S3Client,     useFactory: () => new S3Client() },
    {
      provide:    RawFileS3Repository,
      useFactory: (s3: S3Client) => new RawFileS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject:     [S3Client],
    },
    {
      provide:    StagedFileS3Repository,
      useFactory: (s3: S3Client) => new StagedFileS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject:     [S3Client],
    },
    {
      provide:    JobDbRepository,
      useFactory: (dynamo: DynamoClient) => new JobDbRepositoryImpl(dynamo, envConfig.jobsTable),
      inject:     [DynamoClient],
    },
    {
      provide:    ParserService,
      useFactory: (
        raw:    RawFileS3Repository,
        staged: StagedFileS3Repository,
        job:    JobDbRepository,
      ) => new ParserService(raw, staged, job),
      inject: [RawFileS3Repository, StagedFileS3Repository, JobDbRepository],
    },
    {
      provide:    ParseFileUseCase,
      useFactory: (svc: ParserService) => new ParseFileUseCase(svc),
      inject:     [ParserService],
    },
    {
      provide:    ParserController,
      useFactory: (uc: ParseFileUseCase) => new ParserController(uc),
      inject:     [ParseFileUseCase],
    },
  ],
})
export class ParserModule {}
