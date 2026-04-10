import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditorImagesService } from './editor-images.service';
import { StorageService } from '../storage/storage.service';

@ApiTags('Editor Images')
@ApiBearerAuth('JWT-auth')
@Controller('editor-images')
@UseGuards(JwtAuthGuard)
export class EditorImagesController {
  constructor(
    private readonly editorImagesService: EditorImagesService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload an image for use in editor' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to upload (JPEG, PNG, GIF, WebP, max 5MB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Image uploaded successfully' },
        id: { type: 'string', description: 'MediaAsset ID (UUID)' },
        url: { type: 'string', nullable: true, description: 'Image URL (null for S3 storage)' },
        key: { type: 'string', description: 'Storage key for the image' },
        size: { type: 'number', description: 'File size in bytes' },
        inCloud: { type: 'boolean', description: 'Whether using S3 storage' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) {
      return {
        message: 'No file uploaded',
        id: null,
        url: null,
        key: null,
        size: 0,
        inCloud: false,
      };
    }

    // Get user ID from JWT token
    const userId = String(req.user?.id || req.user?.sub);
    if (!userId) {
      return {
        message: 'User not authenticated',
        id: null,
        url: null,
        key: null,
        size: 0,
        inCloud: false,
      };
    }

    const result = await this.editorImagesService.uploadImage(file, userId);

    // Get S3 status directly from StorageService
    const isUsingS3 = this.storageService.isUsingS3();

    return {
      message: 'Image uploaded successfully',
      id: result.id,
      url: result.url,
      key: result.key,
      size: result.size,
      inCloud: isUsingS3,
    };
  }
}
