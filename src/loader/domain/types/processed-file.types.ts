export type ProcessedFileMeta = {
  jobId:       string;
  clientId:    string;
  checksum:    string;
  total:       number;
  valid:       number;
  invalid:     number;
  processedAt: string;
};

export type ProcessedFile = {
  validRows:   Array<Record<string, unknown>>;
  invalidRows: Array<Record<string, unknown>>;
  meta:        ProcessedFileMeta;
};
