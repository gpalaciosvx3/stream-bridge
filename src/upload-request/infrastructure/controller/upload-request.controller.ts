import { Injectable, HttpStatus } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { CreateUploadRequestUseCase } from '../../application/use-cases/create-upload-request.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';
import { HandleExecution } from '../../../common/decorator/handle-execution.decorator';

@Injectable()
export class UploadRequestController {
  constructor(private readonly useCase: CreateUploadRequestUseCase) {}

  @HandleExecution('UPLOAD-REQUEST', ApiGwHelper.error)
  async handle(event: ApiGwExtracted): Promise<APIGatewayProxyResult> {
    return ApiGwHelper.success(HttpStatus.OK, await this.useCase.execute(event.body));
  }
}
