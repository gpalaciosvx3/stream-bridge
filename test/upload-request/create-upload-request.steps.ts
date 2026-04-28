import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { CreateUploadRequestUseCase } from '../../src/upload-request/application/use-cases/create-upload-request.usecase';
import { UploadRequestService } from '../../src/upload-request/domain/service/upload-request.service';
import { JobDbRepository } from '../../src/upload-request/domain/repository/job.db.repository';
import { PresignedUrlS3Repository } from '../../src/upload-request/domain/repository/presigned-url.s3.repository';
import { JobEntity } from '../../src/upload-request/domain/entities/job.entity';
import { JobStatus } from '../../src/common/types/job-status.types';
import { CustomException } from '../../src/common/errors/custom.exception';

const feature = loadFeature('./test/upload-request/features/create-upload-request.feature');

const INVALID_BODIES: Record<string, unknown> = {
  'sin filename':         { clientId: 'ac-farma', contentType: 'text/csv' },
  'sin clientId':         { filename: 'inventario.csv', contentType: 'text/csv' },
  'sin contentType':      { clientId: 'ac-farma', filename: 'inventario.csv' },
  'body no es objeto':    'no soy un objeto',
  'filename con ruta':    { clientId: 'ac-farma', filename: '../etc/passwd', contentType: 'text/csv' },
  'contentType inválido': { clientId: 'ac-farma', filename: 'archivo.bin', contentType: 'application/octet-stream' },
};

defineFeature(feature, test => {
  let jobDbRepository:        jest.Mocked<JobDbRepository>;
  let presignedUrlRepository: jest.Mocked<PresignedUrlS3Repository>;
  let useCase:                CreateUploadRequestUseCase;
  let result:                 unknown;
  let error:                  CustomException | undefined;

  beforeEach(() => {
    jobDbRepository = {
      save:                          jest.fn(),
      findActiveByClientAndFilename: jest.fn(),
    } as jest.Mocked<JobDbRepository>;
    presignedUrlRepository = {
      generatePutUrl: jest.fn(),
    } as jest.Mocked<PresignedUrlS3Repository>;
    const service = new UploadRequestService(jobDbRepository, presignedUrlRepository);
    useCase = new CreateUploadRequestUseCase(service);
    result  = undefined;
    error   = undefined;
  });

  const runUseCase = async (body: unknown): Promise<void> => {
    try {
      result = await useCase.execute(body);
    } catch (e) {
      error = e as CustomException;
    }
  };

  test('El cliente solicita una subida con datos válidos', ({ given, and, when, then }) => {
    given(/^el cliente "(.*)" no tiene jobs activos para "(.*)"$/, () => {
      jobDbRepository.findActiveByClientAndFilename.mockResolvedValue(false);
    });

    and(/^el repositorio de S3 genera la URL "(.*)"$/, (url: string) => {
      presignedUrlRepository.generatePutUrl.mockResolvedValue(url);
    });

    when(/^se ejecuta el caso de uso con clientId "(.*)" filename "(.*)" contentType "(.*)"$/, async (clientId: string, filename: string, contentType: string) => {
      await runUseCase({ clientId, filename, contentType });
    });

    then(/^la respuesta tiene la URL "(.*)"$/, (url: string) => {
      expect(result).toMatchObject({ uploadUrl: url });
    });

    and('la respuesta tiene un jobId', () => {
      expect((result as { jobId: string }).jobId).toEqual(expect.any(String));
    });

    and('el job se persiste con status PENDING', () => {
      expect(jobDbRepository.save).toHaveBeenCalledTimes(1);
      const persisted = jobDbRepository.save.mock.calls[0][0] as JobEntity;
      expect(persisted.status).toBe(JobStatus.PENDING);
    });

    and(/^el job persistido contiene la sourceKey con prefijo "(.*)"$/, (prefix: string) => {
      const persisted = jobDbRepository.save.mock.calls[0][0] as JobEntity;
      expect(persisted.sourceKey.startsWith(prefix)).toBe(true);
    });
  });

  test('Ya existe un job activo para el mismo cliente y filename', ({ given, when, then, and }) => {
    given(/^el cliente "(.*)" tiene un job activo para "(.*)"$/, () => {
      jobDbRepository.findActiveByClientAndFilename.mockResolvedValue(true);
    });

    when(/^se ejecuta el caso de uso con clientId "(.*)" filename "(.*)" contentType "(.*)"$/, async (clientId: string, filename: string, contentType: string) => {
      await runUseCase({ clientId, filename, contentType });
    });

    then(/^la ejecución falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });

    and('el job no se persiste', () => {
      expect(jobDbRepository.save).not.toHaveBeenCalled();
    });
  });

  test('El DTO rechaza el input por formato inválido', ({ when, then, and }) => {
    when(/^se ejecuta el caso de uso con un body inválido del tipo "(.*)"$/, async (tipo: string) => {
      await runUseCase(INVALID_BODIES[tipo]);
    });

    then(/^la ejecución falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });

    and('el job no se persiste', () => {
      expect(jobDbRepository.save).not.toHaveBeenCalled();
    });
  });

  test('La entidad rechaza invariantes de dominio', ({ when, then }) => {
    when(/^se construye la entidad con clientId "(.*)" filename "(.*)" contentType "(.*)"$/, (clientId: string, filename: string, contentType: string) => {
      try {
        JobEntity.build({ clientId, filename, contentType: contentType as Parameters<typeof JobEntity.build>[0]['contentType'] });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^la construcción falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });
});
