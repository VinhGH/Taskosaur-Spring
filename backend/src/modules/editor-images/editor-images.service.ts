import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';
import * as crypto from 'crypto';

@Injectable()
export class EditorImagesService {
  private readonly allowedMimeTypes: string[];
  private readonly maxFileSize: number;

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
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
   * Format: {timestamp}-{uuid}.{ext}
   */
  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const uuid = crypto.randomUUID();
    const extension = originalName.split('.').pop()?.toLowerCase() || 'png';
    return `${timestamp}-${uuid}.${extension}`;
  }

  /**
   * Upload and save editor image
   * Returns upload result with URL or storage key
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ url: string | null; key: string; size: number }> {
    // Validate file
    this.validateImageFile(file);

    // Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(file.originalname);

    // Create folder structure: editor-images/{userId}
    const folder = `editor-images/${userId}`;

    // Create modified file object with unique filename
    const fileWithUniqueName: Express.Multer.File = {
      ...file,
      originalname: uniqueFilename,
    } as Express.Multer.File;

    // Save file using storage service
    const result = await this.storageService.saveFile(fileWithUniqueName, folder);

    return result;
  }
}
