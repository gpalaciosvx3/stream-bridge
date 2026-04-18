import { ParserFormat } from '../../types/parser-format.types';

export interface IParserStrategy {
  readonly format: ParserFormat;
  parse(buffer: Buffer): Array<Record<string, unknown>>;
}
