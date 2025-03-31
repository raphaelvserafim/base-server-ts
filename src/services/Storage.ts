import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";


export class StorageServices {
  clientS3: S3Client;
  endpoint: string = "https://usc1.contabostorage.com";
  region: string = "US-central";
  accessViews: string | undefined;


  constructor(data: { endpoint?: string; region?: string; accessViews?: string; access: string; secret: string; }) {
    this.accessViews = data.accessViews;

    this.clientS3 = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: data.access,
        secretAccessKey: data.secret,
      },
      forcePathStyle: true
    });
  }


  async uploadStorage(data: { file: any; bucket: string; folder: string; fileName: string; }) {
    const uploadParams = {
      Bucket: data.bucket,
      Key: `${data.folder}${data.fileName}`,
      Body: data.file.buffer,
      ContentType: data.file.mimetype,
      Metadata: {
        Name: data.file.originalname,
      },
    };

    const command = new PutObjectCommand(uploadParams);

    await this.clientS3.send(command);


    return {
      url: this.getFileStorage(data.bucket, `${data.folder}${data.fileName}`),
      bucket: data.bucket,
      key: `${data.folder}${data.fileName}`,
      contentType: data.file.mimetype,
      size: data.file.size,
      originalName: data.file.originalname,
    };


  }


  getFileStorage(bucket: string, key: string,) {
    return `${this.endpoint}/${this.accessViews}:${bucket}/${key}`;
  }

  async getFileByName(bucket: string, fileName: string) {
    const listParams = {
      Bucket: bucket,
      Prefix: fileName,
    };

    const command = new ListObjectsV2Command(listParams);
    const data = await this.clientS3.send(command);
    const file = data.Contents?.find(item => item.Key?.includes(fileName));

    if (file) {
      return {
        url: this.getFileStorage(bucket, file.Key || ''),
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
      };
    } else {
      return null;
    }
  }


}