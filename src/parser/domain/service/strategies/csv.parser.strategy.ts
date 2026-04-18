import Papa from 'papaparse';
import { IParserStrategy } from './parser.strategy';
import { ParserFormat } from '../../types/parser-format.types';

export class CsvParserStrategy implements IParserStrategy {
  readonly format = ParserFormat.CSV;

  parse(buffer: Buffer): Array<Record<string, unknown>> {
    const result = Papa.parse<Record<string, unknown>>(buffer.toString('utf-8'), {
      header:         true,
      skipEmptyLines: true,
      dynamicTyping:  true,
    });
    return result.data;
  }
}
