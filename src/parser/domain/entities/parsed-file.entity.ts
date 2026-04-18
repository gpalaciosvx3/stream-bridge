import { ParserFormat } from '../types/parser-format.types';
import { ParsedFile } from '../types/parsed-file.types';

export class ParsedFileEntity {
  private constructor(
    public readonly rows:         Array<Record<string, unknown>>,
    public readonly totalRows:    number,
    public readonly sourceFormat: ParserFormat,
  ) {}

  static build(rows: Array<Record<string, unknown>>, format: ParserFormat): ParsedFileEntity {
    return new ParsedFileEntity(rows, rows.length, format);
  }

  toFile(): ParsedFile {
    return {
      rows:         this.rows,
      totalRows:    this.totalRows,
      sourceFormat: this.sourceFormat,
    };
  }
}
