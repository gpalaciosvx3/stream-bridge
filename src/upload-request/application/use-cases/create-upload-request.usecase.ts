import { Injectable, Logger } from '@nestjs/common';
import { UploadRequestService } from '../../domain/service/upload-request.service';
import { UploadRequestRequestDto } from '../dtos/upload-request.request.dto';
import { UploadRequestResponseDto } from '../dtos/upload-request.response.dto';
import { ValidationException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';

@Injectable()
export class CreateUploadRequestUseCase {
  private readonly logger = new Logger(CreateUploadRequestUseCase.name);
  
  constructor(private readonly uploadRequestService: UploadRequestService) {}

  async execute(body: unknown): Promise<UploadRequestResponseDto> {
    this.logger.log(`---------- INICIO: UPLOAD-REQUEST => Cliente ${JSON.stringify(body)} ----------`);
    const result = UploadRequestRequestDto.safeParse(body);

    if (!result.success) throw new ValidationException(ErrorDictionary.VALIDATION_ERROR, result.error.issues);
    this.logger.log(`DTO validado correctamente para cliente: ${result.data.clientId}`);

    const response = await this.uploadRequestService.createUpload(result.data);
    this.logger.log(`---------- FIN: UPLOAD-REQUEST => URL ${JSON.stringify(response.uploadUrl.slice(0, 50))}... ----------`);
    return response;
  }
}
