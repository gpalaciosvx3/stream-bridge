export type StagedParsedFile = {
  rows:         Array<Record<string, unknown>>;
  totalRows:    number;
  sourceFormat: string;
};
