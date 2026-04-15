// Updated S3Service with upload and delete methods
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION');
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME')!;

    this.logger.log(`Initializing S3 client for bucket: ${this.bucketName}`);

    this.s3Client = new S3Client({
      region: region || 'ap-south-1',
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }

  getBucketName(): string {
    return this.bucketName;
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const contentType = mime.getType(file.originalname) || 'application/octet-stream';

    this.logger.log(`Uploading file to S3: ${key}, size: ${file.size} bytes`);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`Successfully uploaded to S3: ${key}`);
      // Return the public URL or generate a signed URL
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`S3 upload failed: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getPutPresignedUrl(key: string): Promise<string> {
    const contentType = mime.getType(key) || 'application/octet-stream';
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 30 * 60,
    });
    return url;
  }

  async getGetPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 60 * 30,
    });
    return url;
  }
  async headBucket(bucketName: string): Promise<void> {
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await this.s3Client.send(command);
  }
  async getFileStream(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      // AWS SDK v3 returns Body as a readable stream
      return response.Body as Readable;
    } catch (error) {
      console.error('Failed to get S3 file stream:', error);
      throw new InternalServerErrorException('Failed to retrieve file from S3');
    }
  }
}
