import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.findById(user.sub);
    return { success: true, data: profile };
  }

  @Put('me')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { displayName?: string; username?: string | null; bio?: string | null },
  ) {
    const profile = await this.usersService.updateProfile(user.sub, body);
    return { success: true, data: profile };
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: JwtPayload) {
    await this.usersService.deleteAccount(user.sub);
    return { success: true, data: { message: 'Account deleted' } };
  }

  @Get('search')
  async search(
    @CurrentUser() user: JwtPayload,
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const results = await this.usersService.searchUsers(query, user.sub, page, pageSize);
    return { success: true, data: results };
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const profile = await this.usersService.findById(id);
    return { success: true, data: profile };
  }

  @Put('block/:userId')
  async blockUser(@CurrentUser() user: JwtPayload, @Param('userId') blockedId: string) {
    await this.usersService.blockUser(user.sub, blockedId);
    return { success: true, data: { message: 'User blocked' } };
  }

  @Delete('block/:userId')
  async unblockUser(@CurrentUser() user: JwtPayload, @Param('userId') blockedId: string) {
    await this.usersService.unblockUser(user.sub, blockedId);
    return { success: true, data: { message: 'User unblocked' } };
  }

  @Get('blocked/list')
  async getBlockedUsers(@CurrentUser() user: JwtPayload) {
    const blocked = await this.usersService.getBlockedUsers(user.sub);
    return { success: true, data: blocked };
  }

  @Put('pre-keys')
  async uploadPreKeys(
    @CurrentUser() user: JwtPayload,
    @Body() body: { preKeys: Array<{ keyId: number; publicKey: string }> },
  ) {
    await this.usersService.uploadPreKeys(user.sub, body.preKeys);
    return { success: true, data: { message: 'Pre-keys uploaded' } };
  }

  @Get(':userId/pre-key')
  async getPreKey(@Param('userId') userId: string) {
    const preKey = await this.usersService.getPreKey(userId);
    return { success: true, data: preKey };
  }

  @Get(':userId/public-key')
  async getPublicKey(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    return { success: true, data: { publicKey: user.publicKey, userId: user.id } };
  }
}
