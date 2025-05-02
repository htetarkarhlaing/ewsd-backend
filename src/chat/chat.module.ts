import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AdminSocketGateway } from 'src/socket/admin.gateway';
import { JwtService } from '@nestjs/jwt';
import { StudentSocketGateway } from 'src/socket/student.gateway';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    AdminSocketGateway,
    StudentSocketGateway,
    JwtService,
  ],
})
export class ChatModule {}
