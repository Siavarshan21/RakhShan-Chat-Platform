import { Controller, Post, Body, Delete, Param, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('verify')
  async requestVerification(@Body() body: { phoneNumber: string }) {
    const result = await this.authService.requestVerification(body.phoneNumber);
    return { success: true, data: result };
  }

  @Public()
  @Post('register')
  async register(
    @Body()
    body: {
      phoneNumber: string;
      displayName: string;
      verificationCode: string;
      publicKey: string;
      deviceId: string;
      deviceName: string;
      platform: string;
    },
  ) {
    const result = await this.authService.register(body);
    return { success: true, data: result };
  }

  @Public()
  @Post('login')
  async login(
    @Body()
    body: {
      phoneNumber: string;
      verificationCode: string;
      deviceId: string;
      deviceName: string;
      platform: string;
    },
  ) {
    const result = await this.authService.login(body);
    return { success: true, data: result };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    const tokens = await this.authService.refreshTokens(body.refreshToken);
    return { success: true, data: tokens };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  async logout(@CurrentUser() user: JwtPayload) {
    await this.authService.logout(user.sub, user.deviceId);
    return { success: true, data: { message: 'Logged out successfully' } };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('sessions')
  async getSessions(@CurrentUser() user: JwtPayload) {
    const sessions = await this.authService.getDeviceSessions(user.sub);
    return { success: true, data: sessions };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('sessions/:sessionId')
  async revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.revokeSession(user.sub, sessionId);
    return { success: true, data: { message: 'Session revoked' } };
  }
}
