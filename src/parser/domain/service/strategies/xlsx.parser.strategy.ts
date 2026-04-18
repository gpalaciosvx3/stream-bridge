import * as XLSX from 'xlsx';
import { IParserStrategy } from './parser.strategy';
import { ParserFormat } from '../../types/parser-format.types';

export class XlsxParserStrategy implements IParserStrategy {
  readonly format = ParserFormat.XLSX;

  parse(buffer: Buffer): Array<Record<string, unknown>> {
    const workbook  = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet     = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  }
}
