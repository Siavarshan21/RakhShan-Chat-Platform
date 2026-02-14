import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  async getUploadUrl(
    @CurrentUser() user: JwtPayload,
    @Body() body: { fileName: string; mimeType: string; fileSize: number },
  ) {
    const result = await this.mediaService.generateUploadUrl(
      user.sub,
      body.fileName,
      body.mimeType,
      body.fileSize,
    );
    return { success: true, data: result };
  }

  @Get('download-url')
  async getDownloadUrl(@Query('key') key: string) {
    const result = await this.mediaService.generateDownloadUrl(key);
    return { success: true, data: result };
  }
}
