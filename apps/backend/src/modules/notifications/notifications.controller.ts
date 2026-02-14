import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  async registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token: string; platform: string; deviceId: string },
  ) {
    await this.notificationsService.registerDeviceToken(
      user.sub,
      body.token,
      body.platform,
      body.deviceId,
    );
    return { success: true, data: { message: 'Device registered' } };
  }

  @Delete('unregister')
  async unregisterToken(@Body() body: { token: string }) {
    await this.notificationsService.unregisterDeviceToken(body.token);
    return { success: true, data: { message: 'Device unregistered' } };
  }
}
