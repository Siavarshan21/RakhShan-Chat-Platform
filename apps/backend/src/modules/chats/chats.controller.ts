import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async getChats(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.chatsService.getUserChats(user.sub, page, pageSize);
    return { success: true, data: result };
  }

  @Post('private')
  async createPrivateChat(
    @CurrentUser() user: JwtPayload,
    @Body() body: { userId: string },
  ) {
    const chat = await this.chatsService.createPrivateChat(user.sub, body.userId);
    return { success: true, data: chat };
  }

  @Post('group')
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string; description?: string; memberIds: string[] },
  ) {
    const chat = await this.chatsService.createGroup(user.sub, body);
    return { success: true, data: chat };
  }

  @Get(':chatId')
  async getChat(@CurrentUser() user: JwtPayload, @Param('chatId') chatId: string) {
    const chat = await this.chatsService.getChatById(chatId, user.sub);
    return { success: true, data: chat };
  }

  @Put(':chatId')
  async updateChat(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Body() body: { name?: string; description?: string },
  ) {
    const chat = await this.chatsService.updateChat(chatId, user.sub, body);
    return { success: true, data: chat };
  }

  @Delete(':chatId')
  async deleteChat(@CurrentUser() user: JwtPayload, @Param('chatId') chatId: string) {
    await this.chatsService.deleteChat(chatId, user.sub);
    return { success: true, data: { message: 'Chat deleted' } };
  }

  @Post(':chatId/members')
  async addMembers(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Body() body: { memberIds: string[] },
  ) {
    const chat = await this.chatsService.addMembers(chatId, user.sub, body.memberIds);
    return { success: true, data: chat };
  }

  @Delete(':chatId/members/:userId')
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.chatsService.removeMember(chatId, user.sub, targetUserId);
    return { success: true, data: { message: 'Member removed' } };
  }

  @Put(':chatId/pin')
  async togglePin(@CurrentUser() user: JwtPayload, @Param('chatId') chatId: string) {
    await this.chatsService.togglePin(chatId, user.sub);
    return { success: true, data: { message: 'Pin toggled' } };
  }

  @Put(':chatId/mute')
  async toggleMute(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Body() body: { mutedUntil?: string },
  ) {
    const mutedUntil = body.mutedUntil ? new Date(body.mutedUntil) : undefined;
    await this.chatsService.toggleMute(chatId, user.sub, mutedUntil);
    return { success: true, data: { message: 'Mute toggled' } };
  }

  @Put(':chatId/archive')
  async toggleArchive(@CurrentUser() user: JwtPayload, @Param('chatId') chatId: string) {
    await this.chatsService.toggleArchive(chatId, user.sub);
    return { success: true, data: { message: 'Archive toggled' } };
  }
}
