import { SchemaRecord } from '../types/schema-record.types';

export abstract class SchemaDbRepository {
  abstract findActiveByClientId(clientId: string): Promise<SchemaRecord | null>;
}
