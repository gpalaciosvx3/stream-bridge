import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';
import { InfraConstants } from '../../../common/constants/infra.constants';

interface PipelineBucketProps {
  ingestionQueue: sqs.Queue;
}

export class PipelineBucketConstruct extends Construct {
  readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: PipelineBucketProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: ResourceConstants.PIPELINE_BUCKET,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          prefix: InfraConstants.S3_RAW_FOLDER,
          expiration: cdk.Duration.days(30),
        },
        {
          prefix: InfraConstants.S3_STAGING_FOLDER,
          expiration: cdk.Duration.days(7),
        },
      ],
    });

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(props.ingestionQueue),
      { prefix: InfraConstants.S3_RAW_FOLDER },
    );
  }
}
