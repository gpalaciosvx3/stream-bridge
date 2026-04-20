import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface ValidatorRoleProps {
  jobsTableArn:    string;
  schemasTableArn: string;
  bucketArn:       string;
}

export class ValidatorRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: ValidatorRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName:  ResourceConstants.VALIDATOR_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3StagingAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['s3:GetObject', 's3:PutObject'],
              resources: [`${props.bucketArn}/staging/*`],
            }),
          ],
        }),
        DynamoDbReadSchema: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['dynamodb:Query'],
              resources: [props.schemasTableArn],
            }),
          ],
        }),
        DynamoDbUpdateJob: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['dynamodb:UpdateItem'],
              resources: [props.jobsTableArn],
            }),
          ],
        }),
      },
    });
  }
}
