export class ParserConstants {
  static readonly CHECKSUM_ALGORITHM  = 'sha256' as const;
  static readonly BYTES_PER_KB        = 1024;
  static readonly STAGED_KEY_PREFIX   = 'staging';
  static readonly STAGED_PARSED_FILE  = 'parsed.json';
}
