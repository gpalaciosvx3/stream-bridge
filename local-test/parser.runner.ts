import 'dotenv/config';
import { handler } from '../src/parser/infrastructure/bootstrap/parser.handler';
import { ParseInput } from '../src/parser/domain/types/parser-input.types';

const clientId = process.env.TEST_CLIENT_ID  ?? 'CLIENT-ID';
const jobId    = process.env.TEST_JOB_ID     ?? 'JOB-ID';
const ext      = process.env.TEST_FILE_EXT   ?? 'EXT';
const date     = process.env.TEST_DATE       ?? new Date().toISOString().split('T')[0];

const input: ParseInput = {
  clientId,
  jobId,
  bucket: 'ue1streambridges3001',
  key:    `raw-uploads/${clientId}/${date}/${jobId}/${clientId}.${ext}`,
};

handler(input)
  .then(result => console.log('[PARSER-RUNNER] Resultado:', JSON.stringify(result, null, 2)))
  .catch(error => console.error('[PARSER-RUNNER] Error:', error));
