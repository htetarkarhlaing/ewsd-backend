import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminService } from './admin.service';
import { JwtAdminStrategy } from './strategy/jwt.admin.strategy';
import { JwtStudentStrategy } from './strategy/jwt.student.strategy';
import { studentLocalStrategy } from './strategy/student.local.strategy';
import { AdminLocalStrategy } from './strategy/admin.local.strategy';
import { JwtService } from '@nestjs/jwt';
import { StudentService } from './student.service';
import { ConfigService } from '@nestjs/config';
import { JwtGuardStrategy } from './strategy/jwt.guard.strategy';
import { guardLocalStrategy } from './strategy/guard.local.strategy';
import { GuestService } from './guest.service';

@Module({
  controllers: [AuthController],
  providers: [
    AdminService,
    StudentService,
    ConfigService,
    PrismaService,
    JwtAdminStrategy,
    JwtStudentStrategy,
    studentLocalStrategy,
    AdminLocalStrategy,
    JwtGuardStrategy,
    guardLocalStrategy,
    GuestService,
    JwtService,
  ],
})
export class AuthModule {}
