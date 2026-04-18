import { IParserStrategy } from './parser.strategy';
import { ParserFormat } from '../../types/parser-format.types';

export class TxtParserStrategy implements IParserStrategy {
  readonly format = ParserFormat.TXT;

  parse(buffer: Buffer): Array<Record<string, unknown>> {
    const lines     = buffer.toString('utf-8').split('\n').filter(l => l.trim());
    const delimiter = this.detectDelimiter(lines[0]);
    const headers   = lines[0].split(delimiter).map(h => h.trim());
    return lines.slice(1).map(line => this.parseLine(line, headers, delimiter));
  }

  private detectDelimiter(firstLine: string): string {
    if (firstLine.includes('|'))  return '|';
    if (firstLine.includes('\t')) return '\t';
    return ',';
  }

  private parseLine(
    line:      string,
    headers:   string[],
    delimiter: string,
  ): Record<string, unknown> {
    const values = line.split(delimiter);
    return headers.reduce<Record<string, unknown>>((acc, header, i) => {
      acc[header] = values[i]?.trim() ?? null;
      return acc;
    }, {});
  }
}
