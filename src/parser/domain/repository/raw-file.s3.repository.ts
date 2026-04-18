export abstract class RawFileS3Repository {
  abstract download(bucket: string, key: string): Promise<Buffer>;
}
