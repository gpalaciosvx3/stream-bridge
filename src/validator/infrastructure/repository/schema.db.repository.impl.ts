import { Injectable } from '@nestjs/common';
import { DynamoClient } from '../../../common/dynamo/dynamo.client';
import { SchemaDbRepository } from '../../domain/repository/schema.db.repository';
import { SchemaRecord } from '../../domain/types/schema-record.types';

@Injectable()
export class SchemaDbRepositoryImpl extends SchemaDbRepository {
  constructor(
    private readonly dynamo: DynamoClient,
    private readonly table:  string,
  ) {
    super();
  }

  async findActiveByClientId(clientId: string): Promise<SchemaRecord | null> {
    const results = await this.dynamo.query<SchemaRecord>(this.table, {
      keyCondition:     '#clientId = :clientId',
      filterExpression: '#active = :active',
      attributeNames:   { '#clientId': 'clientId', '#active': 'active' },
      attributeValues:  { ':clientId': clientId, ':active': true },
    });

    return results
      .sort((a, b) => b.schemaVersion.localeCompare(a.schemaVersion))
      .map(r => {
        const raw = typeof r.zodSchema === 'string' ? JSON.parse(r.zodSchema) : r.zodSchema;
        const zodSchema = Array.isArray(raw)
          ? raw
          : Object.entries(raw).map(([name, field]) => ({ name, ...(field as object) }));
        return { ...r, zodSchema };
      })
      [0] ?? null;
  }
}
