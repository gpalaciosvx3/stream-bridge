import { Module } from '@nestjs/common';
import { EnvValidationMiddleware } from '../../../common/middleware/env-validation.middleware';
import { EnvConstants } from '../../../common/constants/env.constants';
import { envConfig } from '../../../common/config/env.config';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { S3Client } from '../../../common/s3/s3.client';
import { ParsedFileS3Repository } from '../../domain/repository/parsed-file.s3.repository';
import { ReportS3Repository } from '../../domain/repository/report.s3.repository';
import { SchemaDbRepository } from '../../domain/repository/schema.db.repository';
import { JobDbRepository } from '../../domain/repository/job.db.repository';
import { ParsedFileS3RepositoryImpl } from '../repository/parsed-file.s3.repository.impl';
import { ReportS3RepositoryImpl } from '../repository/report.s3.repository.impl';
import { SchemaDbRepositoryImpl } from '../repository/schema.db.repository.impl';
import { JobDbRepositoryImpl } from '../repository/job.db.repository.impl';
import { ValidatorService } from '../../domain/service/validator.service';
import { ValidateFileUseCase } from '../../application/use-cases/validate-file.usecase';
import { ValidatorController } from '../controller/validator.controller';

@Module({
  providers: [
    EnvValidationMiddleware.register(EnvConstants.REQUERIDAS_VALIDATOR),
    { provide: DynamoClient, useFactory: () => new DynamoClient() },
    { provide: S3Client,     useFactory: () => new S3Client() },
    {
      provide:    ParsedFileS3Repository,
      useFactory: (s3: S3Client) => new ParsedFileS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject:     [S3Client],
    },
    {
      provide:    ReportS3Repository,
      useFactory: (s3: S3Client) => new ReportS3RepositoryImpl(s3, envConfig.s3Bucket),
      inject:     [S3Client],
    },
    {
      provide:    SchemaDbRepository,
      useFactory: (dynamo: DynamoClient) => new SchemaDbRepositoryImpl(dynamo, envConfig.schemasTable),
      inject:     [DynamoClient],
    },
    {
      provide:    JobDbRepository,
      useFactory: (dynamo: DynamoClient) => new JobDbRepositoryImpl(dynamo, envConfig.jobsTable),
      inject:     [DynamoClient],
    },
    {
      provide:    ValidatorService,
      useFactory: (
        parsedFile: ParsedFileS3Repository,
        report:     ReportS3Repository,
        schema:     SchemaDbRepository,
        job:        JobDbRepository,
      ) => new ValidatorService(parsedFile, report, schema, job),
      inject: [ParsedFileS3Repository, ReportS3Repository, SchemaDbRepository, JobDbRepository],
    },
    {
      provide:    ValidateFileUseCase,
      useFactory: (svc: ValidatorService) => new ValidateFileUseCase(svc),
      inject:     [ValidatorService],
    },
    {
      provide:    ValidatorController,
      useFactory: (uc: ValidateFileUseCase) => new ValidatorController(uc),
      inject:     [ValidateFileUseCase],
    },
  ],
})
export class ValidatorModule {}
