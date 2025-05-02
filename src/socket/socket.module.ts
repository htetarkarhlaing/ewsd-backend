import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminSocketGateway } from './admin.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentSocketGateway } from './student.gateway';

@Global()
@Module({
  providers: [
    JwtService,
    ConfigService,
    PrismaService,
    AdminSocketGateway,
    StudentSocketGateway,
  ],
  exports: [AdminSocketGateway, StudentSocketGateway],
})
export class SocketModule {}
