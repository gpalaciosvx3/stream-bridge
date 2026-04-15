import { APIGatewayProxyResult } from 'aws-lambda';
import { createLambdaHandler } from '../../../common/bootstrap/lambda.factory';
import { LambdaEventMiddleware } from '../../../common/middleware/lambda-event.middleware';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { UploadRequestModule } from './upload-request.module';
import { UploadRequestController } from '../controller/upload-request.controller';

export const handler = createLambdaHandler<UploadRequestController, unknown, APIGatewayProxyResult>(
  UploadRequestModule,
  UploadRequestController,
  (ctrl, event) => ctrl.handle(LambdaEventMiddleware.extract(event) as ApiGwExtracted),
);
