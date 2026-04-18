import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEvt from 'aws-cdk-lib/aws-lambda-event-sources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';
import { PipelineTriggerRoleConstruct } from '../../iam/pipeline-trigger-role.construct';

interface PipelineTriggerFnProps {
  jobsTable: dynamodb.Table;
  queue:     sqs.Queue;
}

export class PipelineTriggerFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: PipelineTriggerFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_PIPELINE_TRIGGER,
    });

    const role = new PipelineTriggerRoleConstruct(this, 'Role', {
      jobsTableArn:    props.jobsTable.tableArn,
      stateMachineArn: InfraConstants.STATE_MACHINE_ARN,
    });

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_PIPELINE_TRIGGER,
      description:  'Consume mensajes SQS, valida idempotencia e inicia ejecución Step Functions',
      logGroup,
      role: role.role,
      entry: path.join(__dirname, '../../../../../src/pipeline-trigger/infrastructure/bootstrap/pipeline-trigger.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      bundling: lambdaBundling,
      environment: {
        JOBS_TABLE:         props.jobsTable.tableName,
        STEP_FUNCTIONS_ARN: InfraConstants.STATE_MACHINE_ARN,
      },
    });

    this.fn.addEventSource(
      new lambdaEvt.SqsEventSource(props.queue, {
        batchSize:      1,
        maxConcurrency: 10,
      }),
    );
  }
}
