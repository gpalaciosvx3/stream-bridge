import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { ParserFormat } from '../types/parser-format.types';
import { IParserStrategy } from './strategies/parser.strategy';
import { CsvParserStrategy } from './strategies/csv.parser.strategy';
import { XlsxParserStrategy } from './strategies/xlsx.parser.strategy';
import { XmlParserStrategy } from './strategies/xml.parser.strategy';
import { TxtParserStrategy } from './strategies/txt.parser.strategy';

export class ParserFactory {
  private static readonly extensionMap: Record<string, ParserFormat> = {
    csv:  ParserFormat.CSV,
    xlsx: ParserFormat.XLSX,
    xls:  ParserFormat.XLSX,
    xml:  ParserFormat.XML,
    txt:  ParserFormat.TXT,
  };

  private static readonly strategyMap: Record<ParserFormat, IParserStrategy> = {
    [ParserFormat.CSV]:  new CsvParserStrategy(),
    [ParserFormat.XLSX]: new XlsxParserStrategy(),
    [ParserFormat.XML]:  new XmlParserStrategy(),
    [ParserFormat.TXT]:  new TxtParserStrategy(),
  };

  static detectFormat(key: string): ParserFormat {
    const ext    = key.split('.').pop()?.toLowerCase() ?? '';
    const format = ParserFactory.extensionMap[ext];
    if (!format) throw new CustomException(ErrorDictionary.UNSUPPORTED_FORMAT, ext);
    return format;
  }

  static create(format: ParserFormat): IParserStrategy {
    return ParserFactory.strategyMap[format];
  }
}
