import { z } from 'zod';
import { SchemaField } from '../types/schema-record.types';

export class ZodSchemaBuilder {
  private static readonly typeBuilders: Record<
    SchemaField['type'],
    (field: SchemaField) => z.ZodTypeAny
  > = {
    string: (field) => {
      const base = field.pattern ? z.string().regex(new RegExp(field.pattern)) : z.string();
      return field.required ? base : base.optional();
    },
    number: (field) => {
      let base = z.number();
      if (field.min !== undefined) base = base.min(field.min);
      if (field.max !== undefined) base = base.max(field.max);
      return field.required ? base : base.optional();
    },
    enum: (field) => {
      const values = field.values as [string, ...string[]];
      const base   = z.enum(values);
      return field.required ? base : base.optional();
    },
  };

  static build(fields: SchemaField[]): z.ZodObject<z.ZodRawShape> {
    const shape = fields.reduce<z.ZodRawShape>((acc, field) => {
      acc[field.name] = ZodSchemaBuilder.typeBuilders[field.type](field);
      return acc;
    }, {});
    return z.object(shape);
  }
}
