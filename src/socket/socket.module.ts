import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketGateway } from './gateway';
import { PrismaService } from 'src/prisma/prisma.service';

@Global()
@Module({
  providers: [JwtService, ConfigService, PrismaService, SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
