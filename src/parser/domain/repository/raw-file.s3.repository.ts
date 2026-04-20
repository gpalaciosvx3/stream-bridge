export abstract class RawFileS3Repository {
  abstract download(key: string): Promise<Buffer>;
}
