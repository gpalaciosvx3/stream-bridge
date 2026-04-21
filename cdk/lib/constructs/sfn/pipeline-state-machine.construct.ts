import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ResourceConstants } from '../../../common/constants/resource.constants';
import { SfnRoleConstruct } from '../iam/sfn-role.construct';

interface PipelineStateMachineProps {
  parserFnArn:    string;
  validatorFnArn: string;
  loaderFnArn:    string;
  jobsTable:      dynamodb.ITable;
}

export class PipelineStateMachineConstruct extends Construct {
  readonly stateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: PipelineStateMachineProps) {
    super(scope, id);

    const role = new SfnRoleConstruct(this, 'Role', {
      parserFnArn:    props.parserFnArn,
      validatorFnArn: props.validatorFnArn,
      loaderFnArn:    props.loaderFnArn,
      jobsTableArn:   props.jobsTable.tableArn,
    });

    const aslDefinition = this.loadAsl(path.join(__dirname, 'pipeline.asl.yaml'), {
      ParserFunctionArn:    props.parserFnArn,
      ValidatorFunctionArn: props.validatorFnArn,
      LoaderFunctionArn:    props.loaderFnArn,
      JobsTableName:        props.jobsTable.tableName,
    });

    this.stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      stateMachineName: ResourceConstants.STATE_MACHINE,
      stateMachineType: sfn.StateMachineType.STANDARD,
      definitionBody:   sfn.DefinitionBody.fromString(aslDefinition),
      role:             role.role,
      timeout:          cdk.Duration.hours(1),
    });
  }

  private loadAsl(filePath: string, substitutions: Record<string, string>): string {
    let raw = fs.readFileSync(filePath, 'utf-8');

    for (const [key, value] of Object.entries(substitutions)) {
      raw = raw.split(`\${${key}}`).join(value);
    }

    return JSON.stringify(yaml.load(raw));
  }
}
