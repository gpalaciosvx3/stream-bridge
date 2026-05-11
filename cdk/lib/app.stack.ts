import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { JobsTableConstruct } from './constructs/dynamo/jobs-table.construct';
import { SchemasTableConstruct } from './constructs/dynamo/schemas-table.construct';
import { PipelineBucketConstruct } from './constructs/s3/pipeline-bucket.construct';
import { UploadRequestFnConstruct } from './constructs/lambda/upload-request/upload-request-fn.construct';
import { PipelineTriggerFnConstruct } from './constructs/lambda/pipeline-trigger/pipeline-trigger-fn.construct';
import { ParserFnConstruct } from './constructs/lambda/parser/parser-fn.construct';
import { ValidatorFnConstruct } from './constructs/lambda/validator/validator-fn.construct';
import { LoaderFnConstruct } from './constructs/lambda/loader/loader-fn.construct';
import { PipelineStateMachineConstruct } from './constructs/sfn/pipeline-state-machine.construct';
import { FileIngestionQueueConstruct } from './constructs/sqs/file-ingestion-queue.construct';
import { FileIngestionDlqConstruct } from './constructs/sqs/file-ingestion-dlq.construct';
import { HttpApiConstruct } from './constructs/api-gateway/http-api.construct';

type AppStackProps = cdk.StackProps;

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

    const parserFn = new ParserFnConstruct(this, 'ParserFn', {
      jobsTable: jobsTable.table,
      bucket:    bucket.bucket,
    });

    const validatorFn = new ValidatorFnConstruct(this, 'ValidatorFn', {
      jobsTable:    jobsTable.table,
      schemasTable: schemasTable.table,
      bucket:       bucket.bucket,
    });

    const loaderFn = new LoaderFnConstruct(this, 'LoaderFn', {
      jobsTable: jobsTable.table,
      bucket:    bucket.bucket,
    });

    new PipelineStateMachineConstruct(this, 'PipelineStateMachine', {
      parserFnArn:    parserFn.fn.functionArn,
      validatorFnArn: validatorFn.fn.functionArn,
      loaderFnArn:    loaderFn.fn.functionArn,
      jobsTable:      jobsTable.table,
    });

    const api = new HttpApiConstruct(this, 'HttpApi', {
      uploadRequestFn: uploadRequestFn.fn,
    });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url, description: 'API Gateway URL' });
  }
}
