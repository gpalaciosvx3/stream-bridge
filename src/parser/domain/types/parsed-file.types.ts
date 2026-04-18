import { ParserFormat } from './parser-format.types';

export type ParsedFile = {
  rows:         Array<Record<string, unknown>>;
  totalRows:    number;
  sourceFormat: ParserFormat;
};
