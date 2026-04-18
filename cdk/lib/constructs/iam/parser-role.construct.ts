import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface ParserRoleProps {
  jobsTableArn: string;
  bucketArn:    string;
}

export class ParserRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: ParserRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName:  ResourceConstants.PARSER_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3GetRawFile: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['s3:GetObject'],
              resources: [`${props.bucketArn}/raw-uploads/*`],
            }),
          ],
        }),
        S3PutStagedFile: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['s3:PutObject'],
              resources: [`${props.bucketArn}/staging/*`],
            }),
          ],
        }),
        DynamoDbGetAndUpdateJob: new iam.PolicyDocument({
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
