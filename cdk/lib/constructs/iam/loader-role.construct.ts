import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface LoaderRoleProps {
  jobsTableArn: string;
  bucketArn:    string;
}

export class LoaderRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: LoaderRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName:  ResourceConstants.LOADER_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3StagingRead: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['s3:GetObject'],
              resources: [`${props.bucketArn}/staging/*`],
            }),
          ],
        }),
        S3ProcessedWrite: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['s3:PutObject'],
              resources: [`${props.bucketArn}/processed/*`],
            }),
          ],
        }),
        DynamoDbJobAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
              resources: [props.jobsTableArn],
            }),
          ],
        }),
      },
    });
  }
}
