/**
 * Seed: stream-bridge-schemas
 *
 * Popula la tabla DynamoDB con los schemas de validación multi-tenant.
 * Ejecutar contra LocalStack: DYNAMODB_ENDPOINT=http://localhost:4566 ts-node local-test/seed-schemas.ts
 * Ejecutar contra AWS real: ts-node local-test/seed-schemas.ts (usa credenciales del perfil AWS activo)
 *
 * Dependencias requeridas (aún no en package.json, el agente de dev las agrega en FASE 8):
 *   npm install --save-dev @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
 *
 * ─────────────────────────────────────────────────────────────
 * Clientes registrados en este seed:
 *
 *   clientId: ac-farma-dist-norte
 *     Archivo de ejemplo: local-test/samples/ac-farma-dist-norte.csv
 *     Formato esperado:   CSV
 *     Política:           LENIENT (tolera hasta 5% de errores)
 *
 *   clientId: ac-farma-dist-sur
 *     Archivo de ejemplo: local-test/samples/ac-farma-dist-sur.xml
 *     Formato esperado:   XML
 *     Política:           LENIENT (tolera hasta 5% de errores)
 *
 *   clientId: prima-afp
 *     Archivo de ejemplo: local-test/samples/prima-afp-aportes.csv
 *     Formato esperado:   CSV
 *     Política:           STRICT (cualquier error detiene el pipeline)
 *
 *   clientId: ac-farma-dist-este
 *     Archivo de ejemplo: local-test/samples/ac-farma-dist-este.txt
 *     Formato esperado:   TXT (pipe-delimited)
 *     Política:           LENIENT (tolera hasta 5% de errores)
 *
 *   clientId: ac-farma-dist-oeste
 *     Archivo de ejemplo: local-test/samples/ac-farma-dist-oeste.xlsx
 *     Formato esperado:   Excel (.xlsx)
 *     Política:           LENIENT (tolera hasta 5% de errores)
 *     NOTA: el archivo .xlsx es binario y no puede generarse automáticamente.
 *           Crearlo manualmente en cualquier spreadsheet con las columnas:
 *           SKU_PROD | NOMBRE_PROD | PRESENTACION | UNIDADES | PRECIO_COSTO | PRECIO_VENTA | VENCIMIENTO | LOTE
 * ─────────────────────────────────────────────────────────────
 *
 * Formato del campo `zodSchema` (SchemaDescriptor):
 *   Cada clave = nombre de columna tal como llega del parser (case-sensitive).
 *   El validator Lambda deserializa este JSON y construye el schema Zod dinámicamente.
 *
 *   FieldRule:
 *     type:     'string' | 'number' | 'enum' | 'boolean'
 *     required: boolean
 *     min?:     number  → string: minLength | number: valor mínimo
 *     max?:     number  → string: maxLength | number: valor máximo
 *     format?:  'YYYY-MM-DD' | 'YYYY-MM'   → regex de formato aplicado al string
 *     values?:  string[]                   → valores válidos para tipo enum
 */

import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// ─── Cliente DynamoDB ────────────────────────────────────────────────────────

const client = new DynamoDBClient({
  region: process.env['AWS_REGION'] ?? 'us-east-1',
  ...(process.env['DYNAMODB_ENDPOINT']
    ? { endpoint: process.env['DYNAMODB_ENDPOINT'] }
    : {}),
});

const ddb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env['SCHEMAS_TABLE_NAME'] ?? 'stream-bridge-schemas-dev';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const schemas = [
  /**
   * AC Farma — Distribuidora Norte
   * Formato: CSV
   * Columnas: codigo_producto, nombre_producto, presentacion, cantidad_unidades,
   *           precio_unit_sin_igv, fecha_vencimiento, numero_lote, registro_sanitario
   */
  {
    clientId: 'ac-farma-dist-norte',
    schemaVersion: 'v1',
    active: true,
    validationPolicy: 'LENIENT',
    errorThresholdPct: 5,
    createdAt: new Date().toISOString(),
    zodSchema: JSON.stringify({
      codigo_producto:      { type: 'string',  required: true,  min: 1, max: 50 },
      nombre_producto:      { type: 'string',  required: true,  min: 1, max: 200 },
      presentacion:         { type: 'string',  required: false },
      cantidad_unidades:    { type: 'number',  required: true,  min: 0 },
      precio_unit_sin_igv:  { type: 'number',  required: true,  min: 0 },
      fecha_vencimiento:    { type: 'string',  required: true,  format: 'YYYY-MM-DD' },
      numero_lote:          { type: 'string',  required: true,  min: 1 },
      registro_sanitario:   { type: 'string',  required: false },
    }),
  },

  /**
   * AC Farma — Distribuidora Sur
   * Formato: XML
   * Nodos hijos de <producto>: sku, descripcion, unidades_stock, precio,
   *                             fecha_expiracion, lote
   * Nota: usa nombres de campo completamente distintos a dist-norte.
   *       Esto demuestra el valor del schema registry multi-tenant.
   */
  {
    clientId: 'ac-farma-dist-sur',
    schemaVersion: 'v1',
    active: true,
    validationPolicy: 'LENIENT',
    errorThresholdPct: 5,
    createdAt: new Date().toISOString(),
    zodSchema: JSON.stringify({
      sku:             { type: 'string', required: true,  min: 1, max: 50 },
      descripcion:     { type: 'string', required: true,  min: 1, max: 200 },
      unidades_stock:  { type: 'number', required: true,  min: 0 },
      precio:          { type: 'number', required: true,  min: 0 },
      fecha_expiracion:{ type: 'string', required: true,  format: 'YYYY-MM-DD' },
      lote:            { type: 'string', required: true,  min: 1 },
    }),
  },

  /**
   * Prima AFP — Aportes de empleadores
   * Formato: CSV
   * Columnas: ruc_empleador, nombre_empleador, dni_afiliado, apellidos_nombres,
   *           periodo, monto_aporte, tipo_aporte, observaciones
   * Política STRICT: cualquier fila inválida detiene el pipeline completo.
   */
  {
    clientId: 'prima-afp',
    schemaVersion: 'v1',
    active: true,
    validationPolicy: 'STRICT',
    errorThresholdPct: 0,
    createdAt: new Date().toISOString(),
    zodSchema: JSON.stringify({
      ruc_empleador:    { type: 'string',  required: true,  min: 11, max: 11 },
      nombre_empleador: { type: 'string',  required: false },
      dni_afiliado:     { type: 'string',  required: true,  min: 8,  max: 8 },
      apellidos_nombres:{ type: 'string',  required: false },
      periodo:          { type: 'string',  required: true,  format: 'YYYY-MM' },
      monto_aporte:     { type: 'number',  required: true,  min: 0 },
      tipo_aporte:      { type: 'enum',    required: true,  values: ['OBLIGATORIO', 'VOLUNTARIO'] },
      observaciones:    { type: 'string',  required: false },
    }),
  },

  /**
   * AC Farma — Distribuidora Este
   * Formato: TXT (pipe-delimited)
   * Columnas: CODIGO_PROD, NOMBRE_COMERCIAL, CONCENTRACION, FORMA_FARMAC,
   *           CANTIDAD, PVP, FECH_VCTO, NRO_LOTE, ESTADO
   * Archivo de ejemplo: local-test/samples/ac-farma-dist-este.txt
   *
   * parserConfig.delimiter = '|' → el Parser lee este campo desde DynamoDB
   * cuando detecta formato TXT antes de procesar las filas.
   */
  {
    clientId: 'ac-farma-dist-este',
    schemaVersion: 'v1',
    active: true,
    validationPolicy: 'LENIENT',
    errorThresholdPct: 5,
    createdAt: new Date().toISOString(),
    parserConfig: JSON.stringify({ delimiter: '|' }),
    zodSchema: JSON.stringify({
      CODIGO_PROD:      { type: 'string', required: true,  min: 1, max: 50 },
      NOMBRE_COMERCIAL: { type: 'string', required: true,  min: 1, max: 200 },
      CONCENTRACION:    { type: 'string', required: false },
      FORMA_FARMAC:     { type: 'string', required: false },
      CANTIDAD:         { type: 'number', required: true,  min: 0 },
      PVP:              { type: 'number', required: true,  min: 0 },
      FECH_VCTO:        { type: 'string', required: true,  format: 'YYYYMMDD' },
      NRO_LOTE:         { type: 'string', required: true,  min: 1 },
      ESTADO:           { type: 'enum',   required: true,  values: ['DISPONIBLE', 'CUARENTENA', 'VENCIDO', 'BAJA'] },
    }),
  },

  /**
   * AC Farma — Distribuidora Oeste
   * Formato: Excel (.xlsx)
   * Columnas (primera hoja, primera fila = headers):
   *   SKU_PROD | NOMBRE_PROD | PRESENTACION | UNIDADES | PRECIO_COSTO | PRECIO_VENTA | VENCIMIENTO | LOTE
   *
   * NOTA: el archivo .xlsx es un binario que no puede generarse automáticamente.
   *       Crearlo manualmente en Excel/Google Sheets con las columnas indicadas.
   *       Guardarlo en: local-test/samples/ac-farma-dist-oeste.xlsx
   */
  {
    clientId: 'ac-farma-dist-oeste',
    schemaVersion: 'v1',
    active: true,
    validationPolicy: 'LENIENT',
    errorThresholdPct: 5,
    createdAt: new Date().toISOString(),
    zodSchema: JSON.stringify({
      SKU_PROD:      { type: 'string', required: true,  min: 1, max: 50 },
      NOMBRE_PROD:   { type: 'string', required: true,  min: 1, max: 200 },
      PRESENTACION:  { type: 'string', required: false },
      UNIDADES:      { type: 'number', required: true,  min: 0 },
      PRECIO_COSTO:  { type: 'number', required: true,  min: 0 },
      PRECIO_VENTA:  { type: 'number', required: true,  min: 0 },
      VENCIMIENTO:   { type: 'string', required: true,  format: 'YYYY-MM-DD' },
      LOTE:          { type: 'string', required: true,  min: 1 },
    }),
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log(`Seeding ${schemas.length} schemas into "${TABLE_NAME}"...\n`);

  for (const schema of schemas) {
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: schema }));
    console.log(`  ✓ ${schema.clientId} @ ${schema.schemaVersion} (${schema.validationPolicy})`);
  }

  console.log('\nDone.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
