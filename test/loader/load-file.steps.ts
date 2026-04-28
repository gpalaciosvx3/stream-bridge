import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { LoaderService } from '../../src/loader/domain/service/loader.service';
import { LoadJobEntity } from '../../src/loader/domain/entities/load-job.entity';
import { JobDbRepository } from '../../src/loader/domain/repository/job.db.repository';
import { ProcessedFileS3Repository } from '../../src/loader/domain/repository/processed-file.s3.repository';
import { ReportS3Repository } from '../../src/loader/domain/repository/report.s3.repository';
import { StagedFileS3Repository } from '../../src/loader/domain/repository/staged-file.s3.repository';
import { JobStatus } from '../../src/common/types/job-status.types';
import { CustomException } from '../../src/common/errors/custom.exception';

const feature = loadFeature('./test/loader/features/load-file.feature');

const buildParsedFile = (rows: number) => ({
  rows:         Array.from({ length: rows }, (_, i) => ({ id: i + 1, nombre: `Juan${i + 1}` })),
  totalRows:    rows,
  sourceFormat: 'csv',
});

const buildReport = (total: number, invalidRowNumbers: number[]) => ({
  total,
  valid:   total - invalidRowNumbers.length,
  invalid: invalidRowNumbers.length,
  errors:  invalidRowNumbers.map(row => ({ row })),
  passed:  invalidRowNumbers.length === 0,
});

defineFeature(feature, test => {
  let jobDbRepository:         jest.Mocked<JobDbRepository>;
  let stagedFileRepository:    jest.Mocked<StagedFileS3Repository>;
  let reportRepository:        jest.Mocked<ReportS3Repository>;
  let processedFileRepository: jest.Mocked<ProcessedFileS3Repository>;
  let service:                 LoaderService;
  let result:                  unknown;
  let error:                   CustomException | undefined;

  beforeEach(() => {
    jobDbRepository         = { getById: jest.fn(), updateLoadResult: jest.fn() } as jest.Mocked<JobDbRepository>;
    stagedFileRepository    = { download: jest.fn() } as jest.Mocked<StagedFileS3Repository>;
    reportRepository        = { download: jest.fn() } as jest.Mocked<ReportS3Repository>;
    processedFileRepository = { upload:   jest.fn() } as jest.Mocked<ProcessedFileS3Repository>;
    service = new LoaderService(stagedFileRepository, reportRepository, processedFileRepository, jobDbRepository);
    result  = undefined;
    error   = undefined;
  });

  const runService = async (clientId: string, jobId: string, stagedKey: string, checksum: string): Promise<void> => {
    try {
      result = await service.load({
        clientId, jobId, stagedKey, checksum,
        validationReport: { total: 0, valid: 0, invalid: 0, passed: true },
      });
    } catch (e) {
      error = e as CustomException;
    }
  };

  test('El archivo se carga correctamente desde estado VALIDATED', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado VALIDATED con checksum "(.*)"$/, (jobId: string, checksum: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.VALIDATED, checksum, createdAt: new Date().toISOString() });
    });

    and(/^el archivo parseado tiene (\d+) filas$/, (rows: string) => {
      stagedFileRepository.download.mockResolvedValue(buildParsedFile(Number(rows)));
    });

    and(/^el reporte de validación marca la fila (\d+) como inválida$/, (row: string) => {
      reportRepository.download.mockResolvedValue(buildReport(3, [Number(row)]));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then('el archivo procesado se sube a S3', () => {
      expect(processedFileRepository.upload).toHaveBeenCalledTimes(1);
    });

    and(/^el archivo procesado contiene (\d+) filas válidas y (\d+) fila inválida$/, (validas: string, invalidas: string) => {
      const content = processedFileRepository.upload.mock.calls[0][1];
      expect(content.validRows).toHaveLength(Number(validas));
      expect(content.invalidRows).toHaveLength(Number(invalidas));
    });

    and('el job se transiciona a DONE', () => {
      expect(jobDbRepository.updateLoadResult).toHaveBeenCalledTimes(1);
      expect(jobDbRepository.updateLoadResult.mock.calls[0][1].status).toBe(JobStatus.DONE);
    });
  });

  test('El job ya fue procesado con el mismo checksum (idempotencia)', ({ given, when, then, and }) => {
    given(/^el job "(.*)" existe en estado DONE con checksum "(.*)"$/, (jobId: string, checksum: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.DONE, checksum, createdAt: new Date().toISOString() });
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then('el archivo procesado no se sube a S3', () => {
      expect(processedFileRepository.upload).not.toHaveBeenCalled();
    });

    and('el job no se actualiza nuevamente', () => {
      expect(jobDbRepository.updateLoadResult).not.toHaveBeenCalled();
    });

    and('la respuesta indica status DONE', () => {
      expect(result).toMatchObject({ status: JobStatus.DONE });
    });
  });

  test('El job está DONE pero con un checksum diferente', ({ given, when, then }) => {
    given(/^el job "(.*)" existe en estado DONE con checksum "(.*)"$/, (jobId: string, checksum: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.DONE, checksum, createdAt: new Date().toISOString() });
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('El servicio rechaza estados de job no válidos para entrar', ({ given, when, then }) => {
    given(/^el job "(.*)" existe en estado (.*) con checksum "(.*)"$/, (jobId: string, status: string, checksum: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status, checksum, createdAt: new Date().toISOString() });
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('El job no existe en la base de datos', ({ given, when, then }) => {
    given(/^el job "(.*)" no existe en la base de datos$/, () => {
      jobDbRepository.getById.mockResolvedValue(null);
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('La entidad rechaza inputs incompletos de Step Functions', ({ when, then }) => {
    when(/^se construye la entidad de carga con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, (clientId, jobId, stagedKey, checksum) => {
      try {
        LoadJobEntity.build({
          clientId, jobId, stagedKey, checksum,
          validationReport: { total: 0, valid: 0, invalid: 0, passed: true },
        });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^la construcción falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });
});
