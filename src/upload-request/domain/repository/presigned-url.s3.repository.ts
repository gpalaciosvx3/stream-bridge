export abstract class PresignedUrlS3Repository {
  abstract generatePutUrl(key: string, contentType: string, expiresIn: number): Promise<string>;
}
