import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { ResourceConstants } from '../../../common/constants/resource.constants';
import { InfraConstants } from '../../../common/constants/infra.constants';

interface FileIngestionQueueProps {
  dlq: sqs.Queue;
}

export class FileIngestionQueueConstruct extends Construct {
  readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: FileIngestionQueueProps) {
    super(scope, id);

    this.queue = new sqs.Queue(this, 'Queue', {
      queueName:         ResourceConstants.FILE_INGESTION_QUEUE,
      visibilityTimeout: cdk.Duration.seconds(InfraConstants.LAMBDA_TIMEOUT_DEFAULT_SECONDS * 6),
      deadLetterQueue: {
        queue:           props.dlq,
        maxReceiveCount: 3,
      },
    });
  }
}
