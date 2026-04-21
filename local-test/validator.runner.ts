import 'dotenv/config';
import { handler } from '../src/validator/infrastructure/bootstrap/validator.handler';
import { ValidatorInput } from '../src/validator/domain/types/validator-input.types';

const clientId = process.env.TEST_CLIENT_ID ?? 'CLIENT-ID';
const jobId    = process.env.TEST_JOB_ID    ?? 'JOB-ID';
const checksum = process.env.TEST_CHECKSUM  ?? 'CHECK-SUM';

const input: ValidatorInput = {
  clientId,
  jobId,
  stagedKey: `staging/${jobId}/parsed.json`,
  checksum,
  totalRows: 0,
};

handler(input)
  .then(result => console.log('[VALIDATOR-RUNNER] Resultado:', JSON.stringify(result, null, 2)))
  .catch(error => console.error('[VALIDATOR-RUNNER] Error:', error));
