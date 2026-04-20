export type ValidationPolicy = 'STRICT' | 'LENIENT';

export type SchemaFieldType = 'string' | 'number' | 'enum';

export type SchemaField = {
  name:     string;
  type:     SchemaFieldType;
  required: boolean;
  min?:     number;
  max?:     number;
  pattern?: string;
  values?:  string[];
};

export type SchemaRecord = {
  clientId:           string;
  schemaVersion:      string;
  zodSchema:          SchemaField[];
  validationPolicy:   ValidationPolicy;
  errorThresholdPct?: number;
  active:             boolean;
};
