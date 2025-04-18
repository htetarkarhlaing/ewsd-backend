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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly adminService: AdminService,
    private studentService: StudentService,
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
}
