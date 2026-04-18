import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';

export class FileIngestionDlqConstruct extends Construct {
  readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'Queue', {
      queueName:       ResourceConstants.FILE_INGESTION_DLQ,
      retentionPeriod: cdk.Duration.days(3),
    });
  }
}
