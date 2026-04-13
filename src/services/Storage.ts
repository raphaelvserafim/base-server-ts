import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SocketServices } from "@app/services/index.js";


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



  async getPresignedUploadUrl(data: {
    bucket: string;
    folder: string;
    fileName: string;
    contentType: string;
    expiresIn?: number; // segundos (padrão: 1 hora)
  }) {
    const key = `${data.folder}${data.fileName}`;

    const command = new PutObjectCommand({
      Bucket: data.bucket,
      Key: key,
      ContentType: data.contentType,
    });

    const presignedUrl = await getSignedUrl(this.clientS3, command, {
      expiresIn: data.expiresIn || 3600,
    });

    return {
      url: presignedUrl,
      key: key,
      bucket: data.bucket,
      expiresIn: data.expiresIn || 3600,
      fileUrl: this.getFileStorage(data.bucket, key),
    };
  }

  async uploadVideoStream(data: { totalBytes: number; file: Readable; bucket: string; folder: string; fileName: string; socket: SocketServices; userId: number; }) {
    try {
      const { totalBytes } = data;

      const upload = new Upload({
        client: this.clientS3,
        params: {
          Bucket: data.bucket,
          Key: `${data.folder}${data.fileName}`,
          Body: data.file,
          ContentType: "video/mp4",
          ContentLength: totalBytes,
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024,
        leavePartsOnError: false,
      });

      let lastPercent = 0;
      upload.on("httpUploadProgress", (progress) => {
        const total = progress.total ?? totalBytes;
        const loaded = progress.loaded ?? 0;
        const percent = Math.min(100, Math.round((loaded / total) * 100));
        if (percent !== lastPercent) {
          lastPercent = percent;
          data.socket.sendNotification([Number(data.userId)], "upload_progress", {
            status: "uploading",
            key: `${data.folder}${data.fileName}`,
            fileName: data.fileName,
            progress: percent,
          });
        }
      });

      const result = await upload.done();
      console.log("✅ Upload concluído:", result);
      return {
        url: this.getFileStorage(data.bucket, `${data.folder}${data.fileName}`),
        bucket: data.bucket,
        key: `${data.folder}${data.fileName}`,
        contentType: "video/mp4",
        size: (data.file as any).size,
        originalName: data.fileName,
      };

    } catch (error) {
      console.error("❌ Erro ao enviar vídeo:", error);
      throw error;
    }
  }

  async uploadStream(data: {
    stream: Readable;
    bucket: string;
    folder: string;
    fileName: string;
    contentType?: string;
  }) {

    const key = `${data.folder}${data.fileName}`;

    const uploadParams = {
      Bucket: data.bucket,
      Key: key,
      Body: data.stream,
      ContentType: data.contentType || "application/octet-stream",
    };

    const command = new PutObjectCommand(uploadParams);

    await this.clientS3.send(command)

    return {
      url: this.getFileStorage(data.bucket, key),
      bucket: data.bucket,
      key,
      contentType: data.contentType || "application/octet-stream",
    };
  }

  async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
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