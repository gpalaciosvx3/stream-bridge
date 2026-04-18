import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface PipelineTriggerRoleProps {
  jobsTableArn:    string;
  stateMachineArn: string;
}

export class PipelineTriggerRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: PipelineTriggerRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName:  ResourceConstants.PIPELINE_TRIGGER_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDbGetAndUpdateJob: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
              resources: [props.jobsTableArn],
            }),
          ],
        }),
        StepFunctionsStartExecution: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['states:StartExecution'],
              resources: [props.stateMachineArn],
            }),
          ],
        }),
        SqsConsumeMessages: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ],
              resources: [`arn:aws:sqs:*:*:${ResourceConstants.FILE_INGESTION_QUEUE}`],
            }),
          ],
        }),
      },
    });
  }
}
