import { XMLParser } from 'fast-xml-parser';
import { IParserStrategy } from './parser.strategy';
import { ParserFormat } from '../../types/parser-format.types';

export class XmlParserStrategy implements IParserStrategy {
  readonly format = ParserFormat.XML;

  parse(buffer: Buffer): Array<Record<string, unknown>> {
    const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsed    = xmlParser.parse(buffer.toString('utf-8')) as Record<string, unknown>;
    const rootKey   = Object.keys(parsed).find(k => !k.startsWith('?') && typeof parsed[k] === 'object' && parsed[k] !== null);
    const root      = (rootKey ? parsed[rootKey] : {}) as Record<string, unknown>;
    const itemKey   = Object.keys(root).find(k => typeof root[k] === 'object' && root[k] !== null);
    const items     = itemKey ? root[itemKey] : undefined;
    return Array.isArray(items) ? items : [items as Record<string, unknown>];
  }
}
