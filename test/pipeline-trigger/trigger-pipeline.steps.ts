import 'reflect-metadata';
import { loadFeature, defineFeature } from 'jest-cucumber';
import { PipelineTriggerService } from '../../src/pipeline-trigger/domain/service/pipeline-trigger.service';
import { PipelineTriggerEntity } from '../../src/pipeline-trigger/domain/entities/pipeline-trigger.entity';
import { JobDbRepository } from '../../src/pipeline-trigger/domain/repository/job.db.repository';
import { PipelineSfnRepository } from '../../src/pipeline-trigger/domain/repository/pipeline.sfn.repository';
import { JobStatus } from '../../src/common/types/job-status.types';
import { CustomException } from '../../src/common/errors/custom.exception';

const feature = loadFeature('./test/pipeline-trigger/features/trigger-pipeline.feature');

const buildS3Event = (bucket: string, key: string): unknown => ({
  Records: [{ s3: { bucket: { name: bucket }, object: { key } } }],
});

const MALFORMED_EVENTS: Record<string, unknown> = {
  'sin records':               { Records: [] },
  'sin bucket name':           { Records: [{ s3: { bucket: {}, object: { key: 'a/b/c/d/e' } } }] },
  'sin object key':            { Records: [{ s3: { bucket: { name: 'b' }, object: {} } }] },
  'key con menos de 5 partes': { Records: [{ s3: { bucket: { name: 'b' }, object: { key: 'a/b/c' } } }] },
};

defineFeature(feature, test => {
  let jobDbRepository:       jest.Mocked<JobDbRepository>;
  let pipelineSfnRepository: jest.Mocked<PipelineSfnRepository>;
  let service:               PipelineTriggerService;
  let error:                 CustomException | undefined;

  beforeEach(() => {
    jobDbRepository = {
      getById:                jest.fn(),
      transitionToProcessing: jest.fn(),
    } as jest.Mocked<JobDbRepository>;
    pipelineSfnRepository = {
      startExecution: jest.fn(),
    } as jest.Mocked<PipelineSfnRepository>;
    service = new PipelineTriggerService(jobDbRepository, pipelineSfnRepository);
    error   = undefined;
  });

  const runService = async (body: unknown): Promise<void> => {
    try {
      await service.trigger(body);
    } catch (e) {
      error = e as CustomException;
    }
  };

  test('El evento S3 dispara el pipeline correctamente', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PENDING$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, clientId: 'ac-farma', status: JobStatus.PENDING });
    });

    and('Step Functions inicia la ejecución correctamente', () => {
      pipelineSfnRepository.startExecution.mockResolvedValue(true);
    });

    when(/^se procesa un evento S3 con bucket "(.*)" key "(.*)"$/, async (bucket: string, key: string) => {
      await runService(buildS3Event(bucket, key));
    });

    then('el job se transiciona a PROCESSING', () => {
      expect(jobDbRepository.transitionToProcessing).toHaveBeenCalledTimes(1);
    });

    and('se inicia la ejecución en Step Functions', () => {
      expect(pipelineSfnRepository.startExecution).toHaveBeenCalledTimes(1);
    });
  });

  test('El job ya no está en estado PENDING', ({ given, when, then, and }) => {
    given(/^el job "(.*)" existe en estado (.*)$/, (jobId: string, status: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, clientId: 'ac-farma', status });
    });

    when(/^se procesa un evento S3 con bucket "(.*)" key "(.*)"$/, async (bucket: string, key: string) => {
      await runService(buildS3Event(bucket, key));
    });

    then('no se inicia ninguna ejecución en Step Functions', () => {
      expect(pipelineSfnRepository.startExecution).not.toHaveBeenCalled();
    });

    and('no se transiciona el estado del job', () => {
      expect(jobDbRepository.transitionToProcessing).not.toHaveBeenCalled();
    });
  });

  test('El job no existe en la base de datos', ({ given, when, then, and }) => {
    given(/^el job "(.*)" no existe en la base de datos$/, () => {
      jobDbRepository.getById.mockResolvedValue(null);
    });

    when(/^se procesa un evento S3 con bucket "(.*)" key "(.*)"$/, async (bucket: string, key: string) => {
      await runService(buildS3Event(bucket, key));
    });

    then('no se inicia ninguna ejecución en Step Functions', () => {
      expect(pipelineSfnRepository.startExecution).not.toHaveBeenCalled();
    });

    and('no se transiciona el estado del job', () => {
      expect(jobDbRepository.transitionToProcessing).not.toHaveBeenCalled();
    });
  });

  test('Step Functions reporta ejecución duplicada', ({ given, and, when, then }) => {
    given(/^el job "(.*)" existe en estado PENDING$/, (jobId: string) => {
      jobDbRepository.getById.mockResolvedValue({ jobId, clientId: 'ac-farma', status: JobStatus.PENDING });
    });

    and('Step Functions reporta que la ejecución ya existe', () => {
      pipelineSfnRepository.startExecution.mockResolvedValue(false);
    });

    when(/^se procesa un evento S3 con bucket "(.*)" key "(.*)"$/, async (bucket: string, key: string) => {
      await runService(buildS3Event(bucket, key));
    });

    then('no se transiciona el estado del job', () => {
      expect(jobDbRepository.transitionToProcessing).not.toHaveBeenCalled();
    });
  });

  test('El evento de prueba de S3 se ignora', ({ when, then, and }) => {
    when(/^se procesa un evento de prueba "(.*)"$/, async (eventName: string) => {
      await runService({ Event: eventName });
    });

    then('no se consulta la base de datos', () => {
      expect(jobDbRepository.getById).not.toHaveBeenCalled();
    });

    and('no se inicia ninguna ejecución en Step Functions', () => {
      expect(pipelineSfnRepository.startExecution).not.toHaveBeenCalled();
    });
  });

  test('La entidad rechaza eventos S3 malformados', ({ when, then }) => {
    when(/^se construye la entidad con un evento del tipo "(.*)"$/, (tipo: string) => {
      try {
        PipelineTriggerEntity.build(MALFORMED_EVENTS[tipo]);
      } catch (e) {
        error = e as CustomException;
      }
    });

    then(/^la construcción falla con código "(.*)"$/, (code: string) => {
      expect(error?.code).toBe(code);
    });
  });
});
