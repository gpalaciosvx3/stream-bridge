import { XMLParser } from 'fast-xml-parser';
import { IParserStrategy } from './parser.strategy';
import { ParserFormat } from '../../types/parser-format.types';

export class XmlParserStrategy implements IParserStrategy {
  readonly format = ParserFormat.XML;

  parse(buffer: Buffer): Array<Record<string, unknown>> {
    const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsed    = xmlParser.parse(buffer.toString('utf-8')) as Record<string, unknown>;
    const rootKey   = Object.keys(parsed)[0];
    const root      = parsed[rootKey] as Record<string, unknown>;
    const itemKey   = Object.keys(root)[0];
    const items     = root[itemKey];
    return Array.isArray(items) ? items : [items as Record<string, unknown>];
  }
}
