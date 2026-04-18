import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { StepFnExtracted } from '../../../common/middleware/types/lambda-event.types';
import { ParserModule } from './parser.module';
import { ParserController } from '../controller/parser.controller';
import { ParseInput } from '../../domain/types/parser-input.types';
import { ParseOutput } from '../../domain/types/parser-output.types';

export const handler = createLambdaHandler<ParserController, unknown, ParseOutput>(
  ParserModule,
  ParserController,
  (ctrl, event) => {
    const { input } = LambdaEventMiddleware.extract(event) as StepFnExtracted<ParseInput>;
    return ctrl.handle(input);
  },
);
