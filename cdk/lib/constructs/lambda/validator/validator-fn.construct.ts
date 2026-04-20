import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { lambdaBundling } from '../shared/bundling.config';
import { InfraConstants } from '../../../../common/constants/infra.constants';
import { ResourceConstants } from '../../../../common/constants/resource.constants';
import { LambdaLogGroupConstruct } from '../../cloudwatch/lambda-log-group.construct';
import { ValidatorRoleConstruct } from '../../iam/validator-role.construct';

interface ValidatorFnProps {
  jobsTable:    dynamodb.Table;
  schemasTable: dynamodb.Table;
  bucket:       s3.Bucket;
}

export class ValidatorFnConstruct extends Construct {
  readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: ValidatorFnProps) {
    super(scope, id);

    const { logGroup } = new LambdaLogGroupConstruct(this, 'LogGroup', {
      functionName: ResourceConstants.LAMBDA_VALIDATOR,
    });

    const role = new ValidatorRoleConstruct(this, 'Role', {
      jobsTableArn:    props.jobsTable.tableArn,
      schemasTableArn: props.schemasTable.tableArn,
      bucketArn:       props.bucket.bucketArn,
    });

    this.fn = new NodejsFunction(this, 'Fn', {
      functionName: ResourceConstants.LAMBDA_VALIDATOR,
      description:  'Valida el archivo parseado contra el schema del cliente y produce un reporte de validación',
      logGroup,
      role: role.role,
      entry: path.join(__dirname, '../../../../../src/validator/infrastructure/bootstrap/validator.handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS),
      memorySize: InfraConstants.LAMBDA_MEMORY_DEFAULT_MB,
      bundling: lambdaBundling,
      environment: {
        S3_BUCKET:     props.bucket.bucketName,
        JOBS_TABLE:    props.jobsTable.tableName,
        SCHEMAS_TABLE: props.schemasTable.tableName,
      },
    });
  }
}
