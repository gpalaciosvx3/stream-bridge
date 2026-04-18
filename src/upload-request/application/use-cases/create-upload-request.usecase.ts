import { Injectable, Logger } from '@nestjs/common';
import { UploadRequestService } from '../../domain/service/upload-request.service';
import { UploadRequestRequestDto } from '../dtos/upload-request.request.dto';
import { UploadRequestOutput } from '../../domain/types/upload-request-output.types';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { LogExecution } from '../../../common/decorator/log-execution.decorator';

@Injectable()
export class CreateUploadRequestUseCase {
  private readonly logger = new Logger(CreateUploadRequestUseCase.name);

  constructor(private readonly uploadRequestService: UploadRequestService) {}

  @LogExecution('UPLOAD-REQUEST')
  async execute(raw: unknown): Promise<UploadRequestOutput> {
    this.logger.log(`Body recibido: ${JSON.stringify(raw)}`);
    const result = UploadRequestRequestDto.safeParse(raw);

    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues);
    this.logger.log(`DTO validado correctamente para cliente: ${result.data.clientId}`);

    return await this.uploadRequestService.createUpload(result.data);
  }
}
