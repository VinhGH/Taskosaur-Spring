import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class EditorImagesService {
  private readonly allowedMimeTypes: string[];
  private readonly maxFileSize: number;

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Default to 5MB if not configured
    this.maxFileSize =
      parseInt(this.configService.get<string>('MAX_EDITOR_IMAGE_SIZE', '5242880'), 10) || 5242880;

    // Default allowed image types
    const allowedTypes = this.configService.get<string>(
      'ALLOWED_IMAGE_TYPES',
      'image/jpeg,image/png,image/gif,image/webp',
    );
    this.allowedMimeTypes = allowedTypes.split(',').map((t) => t.trim());
  }

  /**
   * Validate uploaded image file
   */
  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.map((t) => t.split('/')[1]).join(', ')}`,
      );
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const maxSizeMB = this.maxFileSize / (1024 * 1024);
      throw new BadRequestException(`File size exceeds ${maxSizeMB}MB limit`);
    }
  }

  /**
   * Generate unique filename for uploaded image
   * Format: {uuid}-{timestamp}.{ext}
   */
  generateUniqueFilename(originalName: string): string {
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const extension = originalName.split('.').pop()?.toLowerCase() || 'png';
    return `${uuid}-${timestamp}.${extension}`;
  }

  /**
   * Upload and save editor image
   * Returns upload result with URL, storage key, and MediaAsset ID
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ id: string; url: string | null; key: string; size: number }> {
    // Validate file
    this.validateImageFile(file);

    // Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(file.originalname);

    // Store in flat editor-images folder (no userId)
    const folder = `editor-images`;

    // Create modified file object with unique filename
    const fileWithUniqueName: Express.Multer.File = {
      ...file,
      originalname: uniqueFilename,
    } as Express.Multer.File;

    // Save file using storage service
    const storageResult = await this.storageService.saveFile(fileWithUniqueName, folder);

    // Create MediaAsset record
    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        userId,
        assetType: 'editor-image',
        storageKey: storageResult.key,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        inCloud: this.storageService.isUsingS3(),
      },
    });

    return {
      id: mediaAsset.id,
      url: storageResult.url,
      key: storageResult.key,
      size: storageResult.size,
    };
  }
}
