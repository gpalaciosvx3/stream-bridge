import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StageConfig } from '../common/types/stage-config.types';
import { JobsTableConstruct } from './constructs/dynamo/jobs-table.construct';
import { SchemasTableConstruct } from './constructs/dynamo/schemas-table.construct';
import { PipelineBucketConstruct } from './constructs/s3/pipeline-bucket.construct';
import { UploadRequestFnConstruct } from './constructs/lambda/upload-request/upload-request-fn.construct';
import { HttpApiConstruct } from './constructs/api-gateway/http-api.construct';

interface AppStackProps extends cdk.StackProps {
  config: StageConfig;
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const jobTable        = new JobsTableConstruct(this, 'JobsTable');
    const schemasTable = new SchemasTableConstruct(this, 'SchemasTable');
    const bucket = new PipelineBucketConstruct(this, 'PipelineBucket');

    const uploadRequestFn = new UploadRequestFnConstruct(this, 'UploadRequestFn', {
      jobTable:     jobTable.table,
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

