import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post(':chatId/initiate/:type')
  async initiateCall(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Param('type') type: 'voice' | 'video',
  ) {
    const call = await this.callsService.initiateCall(user.sub, chatId, type);
    return { success: true, data: call };
  }

  @Post(':callId/accept')
  async acceptCall(@CurrentUser() user: JwtPayload, @Param('callId') callId: string) {
    const call = await this.callsService.acceptCall(callId, user.sub);
    return { success: true, data: call };
  }

  @Post(':callId/decline')
  async declineCall(@CurrentUser() user: JwtPayload, @Param('callId') callId: string) {
    await this.callsService.declineCall(callId, user.sub);
    return { success: true, data: { message: 'Call declined' } };
  }

  @Post(':callId/end')
  async endCall(@CurrentUser() user: JwtPayload, @Param('callId') callId: string) {
    await this.callsService.endCall(callId, user.sub);
    return { success: true, data: { message: 'Call ended' } };
  }

  @Get('history')
  async getCallHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.callsService.getCallHistory(user.sub, page, pageSize);
    return { success: true, data: result };
  }

  @Get('ice-servers')
  async getIceServers() {
    const servers = await this.callsService.getIceServers();
    return { success: true, data: servers };
  }
}
