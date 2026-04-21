import 'dotenv/config';
import { handler } from '../src/validator/infrastructure/bootstrap/validator.handler';
import { ValidatorInput } from '../src/validator/domain/types/validator-input.types';

const input: ValidatorInput = {
  clientId:  'dist-sur',
  jobId:     '4f7946c8-9112-4185-815c-bae74bb64e23',
  stagedKey: 'staging/4f7946c8-9112-4185-815c-bae74bb64e23/parsed.json',
  checksum:  '222df7280c111cb1ffc9610b180d9f86e06a85eafe076378169f3515cde017c8',
  totalRows: 0,
};

handler(input)
  .then(result => console.log('[VALIDATOR-RUNNER] Resultado:', JSON.stringify(result, null, 2)))
  .catch(error => console.error('[VALIDATOR-RUNNER] Error:', error));
