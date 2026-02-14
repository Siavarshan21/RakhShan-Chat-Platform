import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { WsAuthService } from './ws-auth.service';
import { ConnectionManager } from './connection-manager';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-dev-secret-change-in-production'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, WsAuthService, ConnectionManager],
  exports: [ChatGateway, ConnectionManager],
})
export class WebsocketModule {}
