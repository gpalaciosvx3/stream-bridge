import { ParserFormat } from './parser-format.types';

export type ParsedJobUpdate = {
  totalRows:    number;
  fileSizeKb:   number;
  sourceFormat: ParserFormat;
  checksum:     string;
  stagedKey:    string;
};
