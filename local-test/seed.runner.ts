import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = 'UE1STREAMBRIDGEDDB002';
const client = new DynamoDBClient({
  region:      'us-east-1',
  endpoint:    'http://localhost:4566',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});
const ddb = DynamoDBDocumentClient.from(client);

const schemas = [
  /**
   * Distribuidora Norte
   * Formato: CSV
   * Columnas: codigo_producto, nombre_producto, presentacion, cantidad_unidades,
   *           precio_unit_sin_igv, fecha_vencimiento, numero_lote, registro_sanitario
   */
  {
    clientId: 'dist-norte',
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
   * Distribuidora Sur
   * Formato: XML
   * Nodos hijos de <producto>: sku, descripcion, unidades_stock, precio,
   *                             fecha_expiracion, lote
   * Nota: usa nombres de campo completamente distintos a dist-norte.
   *       Esto demuestra el valor del schema registry multi-tenant.
   */
  {
    clientId: 'dist-sur',
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
   * Aportes de empleadores
   * Formato: CSV
   * Columnas: ruc_empleador, nombre_empleador, dni_afiliado, apellidos_nombres,
   *           periodo, monto_aporte, tipo_aporte, observaciones
   * Política STRICT: cualquier fila inválida detiene el pipeline completo.
   */
  {
    clientId: 'afp',
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
   * Distribuidora Este
   * Formato: TXT (pipe-delimited)
   * Columnas: CODIGO_PROD, NOMBRE_COMERCIAL, CONCENTRACION, FORMA_FARMAC,
   *           CANTIDAD, PVP, FECH_VCTO, NRO_LOTE, ESTADO
   * Archivo de ejemplo: local-test/samples/dist-este.txt
   *
   * parserConfig.delimiter = '|' → el Parser lee este campo desde DynamoDB
   * cuando detecta formato TXT antes de procesar las filas.
   */
  {
    clientId: 'dist-este',
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
   * Distribuidora Oeste
   * Formato: Excel (.xlsx)
   * Columnas (primera hoja, primera fila = headers):
   *   SKU_PROD | NOMBRE_PROD | PRESENTACION | UNIDADES | PRECIO_COSTO | PRECIO_VENTA | VENCIMIENTO | LOTE
   *
   * NOTA: el archivo .xlsx es un binario que no puede generarse automáticamente.
   *       Crearlo manualmente en Excel/Google Sheets con las columnas indicadas.
   *       Guardarlo en: local-test/samples/dist-oeste.xlsx
   */
  {
    clientId: 'dist-oeste',
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

async function seed(): Promise<void> {
  console.log(`Seeding ${schemas.length} schemas into "${TABLE_NAME}"...\n`);

  for (const schema of schemas) {
    const existing = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { clientId: schema.clientId, schemaVersion: schema.schemaVersion },
    }));

    if (existing.Item) {
      console.log(`  - ${schema.clientId} @ ${schema.schemaVersion} — ya existe, se omite`);
      continue;
    }

    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: schema }));
    console.log(`  ✓ ${schema.clientId} @ ${schema.schemaVersion} (${schema.validationPolicy})`);
  }

  console.log('\nDone.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
