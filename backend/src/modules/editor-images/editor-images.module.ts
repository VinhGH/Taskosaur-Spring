import { Module } from '@nestjs/common';
import { EditorImagesController } from './editor-images.controller';
import { EditorImagesService } from './editor-images.service';
import { S3Module } from '../storage/s3.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [EditorImagesController],
  providers: [EditorImagesService],
  exports: [EditorImagesService],
})
export class EditorImagesModule {}
