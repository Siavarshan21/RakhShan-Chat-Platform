import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('chat/:chatId')
  async getChatMessages(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Query('cursor') cursor?: string,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.messagesService.getChatMessages(chatId, user.sub, cursor, pageSize);
    return { success: true, data: result };
  }

  @Post()
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      chatId: string;
      localId: string;
      type: string;
      encryptedContent: string;
      replyToId?: string;
    },
  ) {
    const message = await this.messagesService.sendMessage({
      ...body,
      senderId: user.sub,
    });
    return { success: true, data: message };
  }

  @Put(':messageId')
  async editMessage(
    @CurrentUser() user: JwtPayload,
    @Param('messageId') messageId: string,
    @Body() body: { encryptedContent: string },
  ) {
    const message = await this.messagesService.editMessage(messageId, user.sub, body.encryptedContent);
    return { success: true, data: message };
  }

  @Delete(':messageId')
  async deleteMessage(
    @CurrentUser() user: JwtPayload,
    @Param('messageId') messageId: string,
    @Query('forEveryone') forEveryone?: string,
  ) {
    await this.messagesService.deleteMessage(messageId, user.sub, forEveryone === 'true');
    return { success: true, data: { message: 'Message deleted' } };
  }

  @Post(':messageId/reactions')
  async addReaction(
    @CurrentUser() user: JwtPayload,
    @Param('messageId') messageId: string,
    @Body() body: { emoji: string },
  ) {
    const reaction = await this.messagesService.addReaction(messageId, user.sub, body.emoji);
    return { success: true, data: reaction };
  }

  @Delete(':messageId/reactions/:emoji')
  async removeReaction(
    @CurrentUser() user: JwtPayload,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    await this.messagesService.removeReaction(messageId, user.sub, emoji);
    return { success: true, data: { message: 'Reaction removed' } };
  }

  @Post('chat/:chatId/read')
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('chatId') chatId: string) {
    const count = await this.messagesService.markAsRead(chatId, user.sub);
    return { success: true, data: { markedCount: count } };
  }

  @Get('chat/:chatId/search')
  async searchMessages(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const result = await this.messagesService.searchMessages(chatId, user.sub, query, page, pageSize);
    return { success: true, data: result };
  }
}
