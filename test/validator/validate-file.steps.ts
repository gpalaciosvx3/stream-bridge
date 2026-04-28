import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { ValidatorService } from '../../src/validator/domain/service/validator.service';
import { ValidationJobEntity } from '../../src/validator/domain/entities/validation-job.entity';
import { JobDbRepository } from '../../src/validator/domain/repository/job.db.repository';
import { ParsedFileS3Repository } from '../../src/validator/domain/repository/parsed-file.s3.repository';
import { ReportS3Repository } from '../../src/validator/domain/repository/report.s3.repository';
import { SchemaDbRepository } from '../../src/validator/domain/repository/schema.db.repository';
import { SchemaField, SchemaRecord, ValidationPolicy } from '../../src/validator/domain/types/schema-record.types';
import { JobStatus } from '../../src/common/types/job-status.types';
import { CustomException } from '../../src/common/errors/custom.exception';

const feature = loadFeature('./test/validator/features/validate-file.feature');

const SCHEMA_FIELDS: SchemaField[] = [
  { name: 'nombre', type: 'string', required: true },
  { name: 'edad',   type: 'number', required: true, min: 0, max: 120 },
];

const buildSchema = (policy: ValidationPolicy, threshold?: number): SchemaRecord => ({
  clientId:          'ac-farma',
  schemaVersion:     'v1',
  zodSchema:         SCHEMA_FIELDS,
  validationPolicy:  policy,
  errorThresholdPct: threshold,
  active:            true,
});

const buildRows = (validas: number, invalidas: number) => ({
  rows: [
    ...Array.from({ length: validas },  (_, i) => ({ nombre: `Juan${i}`, edad: 25 })),
    ...Array.from({ length: invalidas }, ()    => ({ nombre: 'Pedro', edad: 'no-numero' })),
  ],
  totalRows:    validas + invalidas,
  sourceFormat: 'csv',
});

defineFeature(feature, test => {
  let jobDbRepository:      jest.Mocked<JobDbRepository>;
  let parsedFileRepository: jest.Mocked<ParsedFileS3Repository>;
  let reportRepository:     jest.Mocked<ReportS3Repository>;
  let schemaRepository:     jest.Mocked<SchemaDbRepository>;
  let service:              ValidatorService;
  let result:               unknown;
  let error:                CustomException | undefined;

  beforeEach(() => {
    jobDbRepository      = { getById: jest.fn(), updateValidationResult: jest.fn() } as jest.Mocked<JobDbRepository>;
    parsedFileRepository = { download: jest.fn() } as jest.Mocked<ParsedFileS3Repository>;
    reportRepository     = { upload:   jest.fn() } as jest.Mocked<ReportS3Repository>;
    schemaRepository     = { findActiveByClientId: jest.fn() } as jest.Mocked<SchemaDbRepository>;
    service = new ValidatorService(parsedFileRepository, reportRepository, schemaRepository, jobDbRepository);
    result  = undefined;
    error   = undefined;
  });

  const runService = async (clientId: string, jobId: string, stagedKey: string, checksum: string): Promise<void> => {
    try {
      result = await service.validate({ clientId, jobId, stagedKey, checksum, totalRows: 0 });
    } catch (e) {
      error = e as CustomException;
    }
  };

  test('El archivo pasa la validación con política STRICT sin errores', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PARSED$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.PARSED });
    });

    and(/^el cliente "(.*)" tiene un schema activo con política STRICT$/, () => {
      schemaRepository.findActiveByClientId.mockResolvedValue(buildSchema('STRICT'));
    });

    and(/^el archivo parseado tiene (\d+) filas válidas$/, (validas: string) => {
      parsedFileRepository.download.mockResolvedValue(buildRows(Number(validas), 0));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then('el reporte se sube a S3', () => {
      expect(reportRepository.upload).toHaveBeenCalledTimes(1);
    });

    and('el job se transiciona a VALIDATED', () => {
      expect(jobDbRepository.updateValidationResult.mock.calls[0][1].status).toBe(JobStatus.VALIDATED);
    });

    and('la respuesta indica passed true', () => {
      expect(result).toMatchObject({ validationReport: { passed: true } });
    });
  });

  test('El archivo falla la validación con política STRICT por una sola fila inválida', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PARSED$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.PARSED });
    });

    and(/^el cliente "(.*)" tiene un schema activo con política STRICT$/, () => {
      schemaRepository.findActiveByClientId.mockResolvedValue(buildSchema('STRICT'));
    });

    and(/^el archivo parseado tiene (\d+) fila válida y (\d+) fila inválida$/, (v: string, i: string) => {
      parsedFileRepository.download.mockResolvedValue(buildRows(Number(v), Number(i)));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });

    and('el job se transiciona a VALIDATION_FAILED', () => {
      expect(jobDbRepository.updateValidationResult.mock.calls[0][1].status).toBe(JobStatus.VALIDATION_FAILED);
    });
  });

  test('La política LENIENT pasa o falla según el umbral', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PARSED$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.PARSED });
    });

    and(/^el cliente "(.*)" tiene un schema activo con política LENIENT y umbral (\d+)$/, (_c: string, umbral: string) => {
      schemaRepository.findActiveByClientId.mockResolvedValue(buildSchema('LENIENT', Number(umbral)));
    });

    and(/^el archivo parseado tiene (\d+) filas válidas y (\d+) filas inválidas$/, (v: string, i: string) => {
      parsedFileRepository.download.mockResolvedValue(buildRows(Number(v), Number(i)));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then(/^el resultado de la validación es "(.*)"$/, (resultado: string) => {
      const expected = resultado === 'passed' ? JobStatus.VALIDATED : JobStatus.VALIDATION_FAILED;
      expect(jobDbRepository.updateValidationResult.mock.calls[0][1].status).toBe(expected);
      if (resultado === 'failed') expect(error?.code).toBe('VALIDATOR-002');
    });
  });

  test('El servicio rechaza estados de job no válidos para entrar', ({ given, when, then }) => {
    given(/^el job "(.*)" existe en estado (.*)$/, (jobId: string, status: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status });
      schemaRepository.findActiveByClientId.mockResolvedValue(buildSchema('STRICT'));
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
      schemaRepository.findActiveByClientId.mockResolvedValue(buildSchema('STRICT'));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('El cliente no tiene schema activo', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PARSED$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.PARSED });
    });

    and(/^el cliente "(.*)" no tiene un schema activo$/, () => {
      schemaRepository.findActiveByClientId.mockResolvedValue(null);
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, async (c, j, s, ck) => {
      await runService(c, j, s, ck);
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('La entidad rechaza inputs incompletos de Step Functions', ({ when, then }) => {
    when(/^se construye la entidad de validación con clientId "(.*)" jobId "(.*)" stagedKey "(.*)" checksum "(.*)"$/, (clientId, jobId, stagedKey, checksum) => {
      try {
        ValidationJobEntity.build({ clientId, jobId, stagedKey, checksum, totalRows: 0 });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^la construcción falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });
});
