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

    return results.sort((a, b) => b.schemaVersion.localeCompare(a.schemaVersion))[0] ?? null;
  }
}
