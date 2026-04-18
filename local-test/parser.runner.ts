import 'dotenv/config';
import { handler } from '../src/parser/infrastructure/bootstrap/parser.handler';
import { ParseInput } from '../src/parser/domain/types/parser-input.types';

const input: ParseInput = {
  clientId: 'dist-norte',
  jobId:    '<JOB_ID>',
  bucket:   'ue1streambridges3001',
  key:      'raw-uploads/dist-norte/<DATE>/<JOB_ID>/dist-norte.csv',
};

handler(input)
  .then(result => console.log('[PARSER] Resultado:', JSON.stringify(result, null, 2)))
  .catch(console.error);
