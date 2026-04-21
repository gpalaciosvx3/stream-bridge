import 'dotenv/config';
import { handler } from '../src/loader/infrastructure/bootstrap/loader.handler';
import { LoaderInput } from '../src/loader/domain/types/loader-input.types';

const clientId = process.env.TEST_CLIENT_ID ?? 'CLIENT-ID';
const jobId    = process.env.TEST_JOB_ID    ?? 'JOB-ID';
const checksum = process.env.TEST_CHECKSUM  ?? 'CHECK-SUM';

const input: LoaderInput = {
  clientId,
  jobId,
  stagedKey: `staging/${jobId}/parsed.json`,
  checksum,
  validationReport: { total: 0, valid: 0, invalid: 0, passed: true },
};

handler(input)
  .then(result => console.log('[LOADER-RUNNER] Resultado:', JSON.stringify(result, null, 2)))
  .catch(error => console.error('[LOADER-RUNNER] Error:', error));
