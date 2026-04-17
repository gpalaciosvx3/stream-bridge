import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { APIGatewayProxyResult } from 'aws-lambda';
import { CreateUploadRequestUseCase } from '../../application/use-cases/create-upload-request.usecase';
import { ApiGwHelper } from '../../../common/helpers/api-gw.helper';
import { ApiGwExtracted } from '../../../common/middleware/types/lambda-event.types';

@Injectable()
export class UploadRequestController {
  private readonly logger = new Logger(UploadRequestController.name);

  constructor(private readonly useCase: CreateUploadRequestUseCase) {}

  async handle(event: ApiGwExtracted): Promise<APIGatewayProxyResult> {
    try {
      return ApiGwHelper.success(HttpStatus.OK, await this.useCase.execute(event.body));
    } catch (error) {
      this.logger.error('Error en upload-request', error);
      return ApiGwHelper.error(error);
    }
  }
}
