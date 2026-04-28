import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { ParserService } from '../../src/parser/domain/service/parser.service';
import { ParserFactory } from '../../src/parser/domain/service/parser.factory';
import { ParseJobEntity } from '../../src/parser/domain/entities/parse-job.entity';
import { JobDbRepository } from '../../src/parser/domain/repository/job.db.repository';
import { RawFileS3Repository } from '../../src/parser/domain/repository/raw-file.s3.repository';
import { StagedFileS3Repository } from '../../src/parser/domain/repository/staged-file.s3.repository';
import { ParserFormat } from '../../src/parser/domain/types/parser-format.types';
import { JobStatus } from '../../src/common/types/job-status.types';
import { CustomException } from '../../src/common/errors/custom.exception';

const feature = loadFeature('./test/parser/features/parse-file.feature');

const buildCsvBuffer = (rows: number): Buffer => {
  const header = 'nombre,edad';
  const data   = Array.from({ length: rows }, (_, i) => `Juan${i + 1},${30 + i}`);
  return Buffer.from([header, ...data].join('\n'), 'utf-8');
};

const decode = (s: string): string => s.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

defineFeature(feature, test => {
  let jobDbRepository:      jest.Mocked<JobDbRepository>;
  let rawFileRepository:    jest.Mocked<RawFileS3Repository>;
  let stagedFileRepository: jest.Mocked<StagedFileS3Repository>;
  let service:              ParserService;
  let result:               unknown;
  let error:                CustomException | undefined;
  let detectedFormat:       ParserFormat | undefined;
  let parsedRows:           Array<Record<string, unknown>> = [];

  beforeEach(() => {
    jobDbRepository = {
      getById:                jest.fn(),
      transitionToProcessing: jest.fn(),
      transitionToParsed:     jest.fn(),
    } as jest.Mocked<JobDbRepository>;
    rawFileRepository    = { download: jest.fn() } as jest.Mocked<RawFileS3Repository>;
    stagedFileRepository = { upload:   jest.fn() } as jest.Mocked<StagedFileS3Repository>;
    service        = new ParserService(rawFileRepository, stagedFileRepository, jobDbRepository);
    result         = undefined;
    error          = undefined;
    detectedFormat = undefined;
    parsedRows     = [];
  });

  test('El archivo se parsea correctamente según su formato', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PROCESSING$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.PROCESSING });
    });

    and(/^el archivo "(.*)" se descarga correctamente con contenido de "(.*)" filas$/, (_key: string, rows: string) => {
      rawFileRepository.download.mockResolvedValue(buildCsvBuffer(Number(rows)));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" bucket "(.*)" key "(.*)"$/, async (clientId, jobId, bucket, key) => {
      try {
        result = await service.parse({ clientId, jobId, bucket, key });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^el archivo se sube a staging con prefijo "(.*)"$/, (prefix: string) => {
      expect(stagedFileRepository.upload).toHaveBeenCalledTimes(1);
      const uploadKey = stagedFileRepository.upload.mock.calls[0][0];
      expect(uploadKey.startsWith(prefix)).toBe(true);
    });

    and(/^el job se transiciona a PARSED con sourceFormat "(.*)"$/, (sourceFormat: string) => {
      expect(jobDbRepository.transitionToParsed).toHaveBeenCalledTimes(1);
      const update = jobDbRepository.transitionToParsed.mock.calls[0][1];
      expect(update.sourceFormat).toBe(sourceFormat);
    });

    and(/^la respuesta contiene checksum y totalRows "(.*)"$/, (rows: string) => {
      expect(result).toMatchObject({ totalRows: Number(rows), checksum: expect.any(String) });
    });
  });

  test('El job se reconcilia desde PENDING a PROCESSING antes de parsear', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PENDING$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.PENDING });
    });

    and(/^el archivo "(.*)" se descarga correctamente con contenido de "(.*)" filas$/, (_key: string, rows: string) => {
      rawFileRepository.download.mockResolvedValue(buildCsvBuffer(Number(rows)));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" bucket "(.*)" key "(.*)"$/, async (clientId, jobId, bucket, key) => {
      try {
        result = await service.parse({ clientId, jobId, bucket, key });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then('el job se transiciona a PROCESSING como reconciliación', () => {
      expect(jobDbRepository.transitionToProcessing).toHaveBeenCalledTimes(1);
    });

    and(/^el job se transiciona a PARSED con sourceFormat "(.*)"$/, (sourceFormat: string) => {
      expect(jobDbRepository.transitionToParsed).toHaveBeenCalledTimes(1);
      expect(jobDbRepository.transitionToParsed.mock.calls[0][1].sourceFormat).toBe(sourceFormat);
    });
  });

  test('El job no existe en la base de datos', ({ given, when, then }) => {
    given(/^el job "(.*)" no existe en la base de datos$/, () => {
      jobDbRepository.getById.mockResolvedValue(null);
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" bucket "(.*)" key "(.*)"$/, async (clientId, jobId, bucket, key) => {
      try {
        await service.parse({ clientId, jobId, bucket, key });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('El archivo descargado no contiene filas de datos', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PROCESSING$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, status: JobStatus.PROCESSING });
    });

    and(/^el archivo "(.*)" se descarga correctamente con contenido de "(.*)" filas$/, () => {
      rawFileRepository.download.mockResolvedValue(Buffer.from('nombre,edad\n', 'utf-8'));
    });

    when(/^se ejecuta el servicio con clientId "(.*)" jobId "(.*)" bucket "(.*)" key "(.*)"$/, async (clientId, jobId, bucket, key) => {
      try {
        await service.parse({ clientId, jobId, bucket, key });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^el servicio falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('La factory rechaza extensiones no soportadas', ({ when, then }) => {
    when(/^se detecta el formato para la key "(.*)"$/, (key: string) => {
      try {
        ParserFactory.detectFormat(key);
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^la detección falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });

  test('La factory crea la estrategia correcta según el formato', ({ when, then }) => {
    when(/^se detecta el formato para la key "(.*)"$/, (key: string) => {
      detectedFormat = ParserFactory.detectFormat(key);
    });

    then(/^el formato detectado es "(.*)"$/, (format: string) => {
      expect(detectedFormat).toBe(format);
      expect(ParserFactory.create(detectedFormat as ParserFormat)).toBeDefined();
    });
  });

  test('Cada estrategia parsea su formato propio', ({ when, then, and }) => {
    when(/^se parsea el contenido "([^"]*)" con la estrategia "([^"]*)"$/, (contenido: string, estrategia: string) => {
      const formatMap: Record<string, ParserFormat> = {
        'csv':     ParserFormat.CSV,
        'txt-pipe': ParserFormat.TXT,
        'txt-tab':  ParserFormat.TXT,
        'xml':     ParserFormat.XML,
      };
      const strategy = ParserFactory.create(formatMap[estrategia]);
      parsedRows = strategy.parse(Buffer.from(decode(contenido), 'utf-8'));
    });

    then(/^el resultado tiene "(.*)" filas$/, (rows: string) => {
      expect(parsedRows).toHaveLength(Number(rows));
    });

    and(/^la primera fila contiene el campo "(.*)" con valor "(.*)"$/, (field: string, value: string) => {
      expect(String(parsedRows[0][field])).toBe(value);
    });
  });

  test('La entidad rechaza inputs incompletos de Step Functions', ({ when, then }) => {
    when(/^se construye la entidad con clientId "(.*)" jobId "(.*)" bucket "(.*)" key "(.*)"$/, (clientId, jobId, bucket, key) => {
      try {
        ParseJobEntity.build({ clientId, jobId, bucket, key });
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^la construcción falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });
});
