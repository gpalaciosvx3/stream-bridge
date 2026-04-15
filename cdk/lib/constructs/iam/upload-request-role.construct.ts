import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface UploadRequestRoleProps {
  tableArn:  string;
  bucketArn: string;
}

export class UploadRequestRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: UploadRequestRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName: ResourceConstants.UPLOAD_REQUEST_ROLE,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        S3PutRawUploads: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['s3:PutObject'],
              resources: [`${props.bucketArn}/raw-uploads/*`],
            }),
          ],
        }),
        DynamoDbPutJob: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['dynamodb:PutItem'],
              resources: [props.tableArn],
            }),
          ],
        }),
      },
    });
  }
}
