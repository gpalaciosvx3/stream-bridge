import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

interface SfnRoleProps {
  parserFnArn:    string;
  validatorFnArn: string;
  loaderFnArn:    string;
  jobsTableArn:   string;
}

export class SfnRoleConstruct extends Construct {
  readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: SfnRoleProps) {
    super(scope, id);

    this.role = new iam.Role(this, 'Role', {
      roleName:  ResourceConstants.SFN_EXECUTION_ROLE,
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      inlinePolicies: {
        InvokePipelineLambdas: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions:   ['lambda:InvokeFunction'],
              resources: [props.parserFnArn, props.validatorFnArn, props.loaderFnArn],
            }),
          ],
        }),
        DynamoDbUpdateJobOnFailure: new iam.PolicyDocument({
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
