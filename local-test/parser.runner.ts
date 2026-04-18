import 'dotenv/config';
import { handler } from '../src/parser/infrastructure/bootstrap/parser.handler';
import { ParseInput } from '../src/parser/domain/types/parser-input.types';

const input: ParseInput = {
  clientId: 'dist-norte',
  jobId:    'd2aec040-2cd4-45f4-8346-fd66aff74d33',
  bucket:   'ue1streambridges3001',
  key:      'raw-uploads/dist-norte/2026-04-18/d2aec040-2cd4-45f4-8346-fd66aff74d33/dist-norte.csv',
};

handler(input)
  .then(result => console.log('[PARSER-RUNNER] Resultado:', JSON.stringify(result, null, 2)))
  .catch(error => console.error('[PARSER-RUNNER] Error:', error));
