import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDTO } from './dto';
import { Account } from '@prisma/client';
import { Request } from 'express';
import { AdminLocalAuthGuard } from './guards/local-admin-auth.guard';
import { AdminJWTAuthGuard } from './guards/jwt-admin-auth.guard';
import { StudentService } from './student.service';
import { StudentLocalAuthGuard } from './guards/local-student-auth.guard';
import { studentJWTAuthGuard } from './guards/jwt-student-auth.guard';
import { GuestService } from './guest.service';
import { GuestLocalAuthGuard } from './guards/local-guest-auth.guard';
import { guestJWTAuthGuard } from './guards/jwt-guest-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly adminService: AdminService,
    private studentService: StudentService,
    private guestService: GuestService,
  ) {}

  // * Admin auth routes
  @ApiOperation({
    summary: 'Admin login',
    description: 'Both username and email can be used as login credential',
  })
  @ApiBody({
    type: LoginDTO,
  })
  @UseGuards(AdminLocalAuthGuard)
  @Post('admin/login')
  async adminLogin(@Req() req: Request) {
    try {
      const admin = req.user as Omit<Account, 'password'>;

      const adminCredentials = await this.adminService.loginService(admin);
      return {
        data: adminCredentials,
        message: 'Admin login successful',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Admin info provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('admin/whoami')
  async adminWhoAmI(@Req() req: Request) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const adminData = await this.adminService.infoProvider(admin);
      return {
        data: adminData,
        message: 'Admin info successfully',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // * Student auth routes
  @ApiOperation({
    summary: 'Student login',
    description: 'Both username and email can be used as login credential',
  })
  @ApiBody({
    type: LoginDTO,
  })
  @UseGuards(StudentLocalAuthGuard)
  @Post('student/login')
  async studentLogin(@Req() req: Request) {
    try {
      const student = req.user as Omit<Account, 'password'>;

      const studentCredentials =
        await this.studentService.loginService(student);
      return {
        data: studentCredentials,
        message: 'Student login successful',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Admin info provider' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Get('student/whoami')
  async studentWhoAmI(@Req() req: Request) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const adminData = await this.adminService.infoProvider(admin);
      return {
        data: adminData,
        message: 'Admin info successfully',
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // * Guest auth routes
  @ApiOperation({
    summary: 'Guest login',
    description: 'Both username and email can be used as login credential',
  })
  @ApiBody({
    type: LoginDTO,
  })
  @UseGuards(GuestLocalAuthGuard)
  @Post('guest/login')
  async guestLogin(@Req() req: Request) {
    try {
      const guest = req.user as Omit<Account, 'password'>;
      const guestCredential = await this.guestService.loginService(guest);
      return {
        data: guestCredential,
        message: 'Guest login successful',
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Guest info provider' })
  @UseGuards(guestJWTAuthGuard)
  @ApiBearerAuth()
  @Get('guest/whoami')
  async guestWhoAmI(@Req() req: Request) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const adminData = await this.adminService.infoProvider(admin);
      return {
        data: adminData,
        message: 'Admin info successfully',
      };
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
