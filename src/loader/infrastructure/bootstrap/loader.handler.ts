import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { StepFnExtracted } from '../../../common/middleware/types/lambda-event.types';
import { LoaderModule } from './loader.module';
import { LoaderController } from '../controller/loader.controller';
import { LoaderInput } from '../../domain/types/loader-input.types';
import { LoaderOutput } from '../../domain/types/loader-output.types';

export const handler = createLambdaHandler<LoaderController, unknown, LoaderOutput>(
  LoaderModule,
  LoaderController,
  (ctrl, event) => {
    const { input } = LambdaEventMiddleware.extract(event) as StepFnExtracted<LoaderInput>;
    return ctrl.handle(input);
  },
);
