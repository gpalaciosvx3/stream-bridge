import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../common/types/stage-config.types';
import { JobsTableConstruct } from './constructs/dynamo/jobs-table.construct';
import { SchemasTableConstruct } from './constructs/dynamo/schemas-table.construct';
import { PipelineBucketConstruct } from './constructs/s3/pipeline-bucket.construct';
import { UploadRequestFnConstruct } from './constructs/lambda/upload-request/upload-request-fn.construct';
import { PipelineTriggerFnConstruct } from './constructs/lambda/pipeline-trigger/pipeline-trigger-fn.construct';
import { ParserFnConstruct } from './constructs/lambda/parser/parser-fn.construct';
import { ValidatorFnConstruct } from './constructs/lambda/validator/validator-fn.construct';
import { FileIngestionQueueConstruct } from './constructs/sqs/file-ingestion-queue.construct';
import { FileIngestionDlqConstruct } from './constructs/sqs/file-ingestion-dlq.construct';
import { HttpApiConstruct } from './constructs/api-gateway/http-api.construct';

interface AppStackProps extends cdk.StackProps {
  config: StageConfig;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const jobsTable      = new JobsTableConstruct(this, 'JobsTable');
    const schemasTable   = new SchemasTableConstruct(this, 'SchemasTable');
    const ingestionDlq            = new FileIngestionDlqConstruct(this, 'FileIngestionDlq');
    const ingestionQueue = new FileIngestionQueueConstruct(this, 'FileIngestionQueue', { dlq: ingestionDlq.queue });
    const bucket         = new PipelineBucketConstruct(this, 'PipelineBucket', { ingestionQueue: ingestionQueue.queue });

    const uploadRequestFn = new UploadRequestFnConstruct(this, 'UploadRequestFn', {
      jobTable:     jobsTable.table,
      schemasTable: schemasTable.table,
      bucket:       bucket.bucket,
    });

    new PipelineTriggerFnConstruct(this, 'PipelineTriggerFn', {
      jobsTable: jobsTable.table,
      queue:     ingestionQueue.queue,
    });

    new ParserFnConstruct(this, 'ParserFn', {
      jobsTable: jobsTable.table,
      bucket:    bucket.bucket,
    });

    new ValidatorFnConstruct(this, 'ValidatorFn', {
      jobsTable:    jobsTable.table,
      schemasTable: schemasTable.table,
      bucket:       bucket.bucket,
    });

    const api = new HttpApiConstruct(this, 'HttpApi', {
      uploadRequestFn: uploadRequestFn.fn,
      stage: props.config.stage,
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url, description: 'API Gateway URL' });
  }
}
