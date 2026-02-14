import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../encryption/encryption.service';
import { LIMITS, MEDIA_TYPES } from '@rakhshan/shared';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class MediaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async generateUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
  ) {
    this.validateFile(mimeType, fileSize);

    const ext = path.extname(fileName);
    const key = `uploads/${userId}/${crypto.randomUUID()}${ext}`;
    const mediaKey = this.encryptionService.generateMediaKey();

    // In production, generate a pre-signed S3 URL
    const uploadUrl = `${this.configService.get('S3_ENDPOINT', 'http://localhost:9000')}/${this.configService.get('S3_BUCKET', 'rakhshan-chat-media')}/${key}`;

    return {
      uploadUrl,
      key,
      encryptedKey: mediaKey.key,
      iv: mediaKey.iv,
    };
  }

  async generateDownloadUrl(key: string) {
    const endpoint = this.configService.get('S3_ENDPOINT', 'http://localhost:9000');
    const bucket = this.configService.get('S3_BUCKET', 'rakhshan-chat-media');
    return { downloadUrl: `${endpoint}/${bucket}/${key}` };
  }

  private validateFile(mimeType: string, fileSize: number) {
    const allTypes = [
      ...MEDIA_TYPES.IMAGE,
      ...MEDIA_TYPES.VIDEO,
      ...MEDIA_TYPES.AUDIO,
      ...MEDIA_TYPES.DOCUMENT,
    ];

    if (!allTypes.includes(mimeType as any)) {
      throw new BadRequestException(`Unsupported file type: ${mimeType}`);
    }

    const maxSizeBytes = LIMITS.FILE_MAX_SIZE_MB * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      throw new BadRequestException(`File size exceeds ${LIMITS.FILE_MAX_SIZE_MB}MB limit`);
    }

    if (MEDIA_TYPES.IMAGE.includes(mimeType as any) && fileSize > LIMITS.IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`Image size exceeds ${LIMITS.IMAGE_MAX_SIZE_MB}MB limit`);
    }
  }
}
