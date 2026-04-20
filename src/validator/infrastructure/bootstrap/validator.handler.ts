import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { StepFnExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ValidatorModule } from './validator.module';
import { ValidatorController } from '../controller/validator.controller';
import { ValidatorInput } from '../../domain/types/validator-input.types';
import { ValidatorOutput } from '../../domain/types/validator-output.types';

export const handler = createLambdaHandler<ValidatorController, unknown, ValidatorOutput>(
  ValidatorModule,
  ValidatorController,
  (ctrl, event) => {
    const { input } = LambdaEventMiddleware.extract(event) as StepFnExtracted<ValidatorInput>;
    return ctrl.handle(input);
  },
);
