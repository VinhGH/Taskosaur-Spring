import { Module } from '@nestjs/common';
import { EditorImagesController } from './editor-images.controller';
import { EditorImagesService } from './editor-images.service';
import { StorageService } from '../storage/storage.service';
import { S3Service } from '../storage/s3.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EditorImagesController],
  providers: [EditorImagesService, StorageService, S3Service],
  exports: [EditorImagesService],
})
export class EditorImagesModule {}
