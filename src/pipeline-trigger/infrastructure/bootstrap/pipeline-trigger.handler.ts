import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { SqsExtracted } from '../../../common/middleware/types/lambda-event.types';
import { PipelineTriggerModule } from './pipeline-trigger.module';
import { PipelineTriggerController } from '../controller/pipeline-trigger.controller';

export const handler = createLambdaHandler<PipelineTriggerController, unknown, void>(
  PipelineTriggerModule,
  PipelineTriggerController,
  (ctrl, event) => {
    const [record] = (LambdaEventMiddleware.extract(event) as SqsExtracted).records;
    return ctrl.handle(record);
  },
);
