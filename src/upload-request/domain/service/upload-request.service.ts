import { Injectable, Logger } from '@nestjs/common';
import { JobDbRepository } from '../repository/job.db.repository';
import { PresignedUrlS3Repository } from '../repository/presigned-url.s3.repository';
import { JobEntity } from '../entities/job.entity';
import { UploadRequestConstants } from '../constants/upload-request.constants';
import { UploadRequestInput } from '../types/upload-request-input.types';
import { UploadRequestOutput } from '../types/upload-request-output.types';

@Injectable()
export class UploadRequestService {
  private readonly logger = new Logger(UploadRequestService.name);
  
  constructor(
    private readonly jobDbRepository: JobDbRepository,
    private readonly presignedUrlRepository: PresignedUrlS3Repository,
  ) {}

  async createUpload(dto: UploadRequestInput): Promise<UploadRequestOutput> {
    this.logger.log(`[PASO 1] Creando entidad de Job para => cliente: ${dto.clientId} | filename: ${dto.filename}`);
    const job = JobEntity.build(dto);

    this.logger.log(`[PASO 2] Generando URL pre-firmada para jobId => ${job.jobId}`);
    const uploadUrl = await this.presignedUrlRepository.generatePutUrl(
      job.sourceKey,
      dto.contentType,
      UploadRequestConstants.PRESIGNED_URL_TTL_SECONDS,
    );

    this.logger.log(`[PASO 3] Guardando job en la base de datos para url => ${uploadUrl.slice(0, 50)}...`);
    await this.jobDbRepository.save(job);

    return job.toOutput(uploadUrl);
  }
}
