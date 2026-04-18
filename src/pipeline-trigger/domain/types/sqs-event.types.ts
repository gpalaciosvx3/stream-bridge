export type S3EventRecord = {
  s3: {
    bucket: { name: string };
    object: { key: string };
  };
};

export type S3EventNotification = {
  Records: S3EventRecord[];
};
