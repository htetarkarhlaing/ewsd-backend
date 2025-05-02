import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { AccountService } from './account.service';
import { AdminInviteDTO, StudentRegisterDTO } from './dto';
import { Request } from 'express';
import { studentJWTAuthGuard } from 'src/auth/guards/jwt-student-auth.guard';
import { Account } from '@prisma/client';

@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @ApiOperation({ summary: 'Student registration handler' })
  @Post('student-register')
  @ApiBody({
    type: StudentRegisterDTO,
    description: 'Student registration data',
  })
  async studentRegisterHandler(@Body() data: StudentRegisterDTO) {
    try {
      const registeredStudent =
        await this.accountService.studentRegisterHandler(data);
      return {
        data: registeredStudent,
        message:
          'Student account register submitted successfully. Please wait for admin approval.',
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

  @ApiOperation({ summary: 'user invitation handler' })
  @Post('user-invite')
  @ApiBody({
    type: AdminInviteDTO,
    description: 'User invite data',
  })
  async userInvitationHandler(@Body() data: AdminInviteDTO) {
    try {
      const invitedUser = await this.accountService.inviteAdmin(data);
      return {
        data: invitedUser,
        message: 'User invitation mail sent successfully.',
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

  @ApiOperation({ summary: 'Admin invitation handler' })
  @Post('admin-invite')
  @ApiBody({
    type: StudentRegisterDTO,
    description: 'Admin invitation data',
  })
  async adminInvite(@Body() data: StudentRegisterDTO) {
    try {
      const registeredStudent =
        await this.accountService.studentRegisterHandler(data);
      return {
        data: registeredStudent,
        message:
          'Student account register submitted successfully. Please wait for admin approval.',
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

  @ApiOperation({ summary: 'Admin account list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'search',
    required: false,
  })
  @Get('admin-list')
  async adminAccountListFetcher(
    @Req() req: Request,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: 'ALL' | 'ACTIVE' | 'INVITED' | 'SUSPENDED',
    @Query('search')
    search?: string,
  ) {
    try {
      const adminList = await this.accountService.getAccountList(
        'ADMIN',
        req,
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        search,
      );
      return {
        data: adminList,
        message: 'Admin account list fetched successfully',
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

  @ApiOperation({ summary: 'Student account list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('student-list')
  async studentAccountListFetcher(
    @Req() req: Request,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: 'ALL' | 'ACTIVE' | 'PENDING' | 'INVITED' | 'REJECTED' | 'SUSPENDED',
    @Query('search') search?: string,
    @Query('facultyId') facultyId?: string,
  ) {
    try {
      const studentList = await this.accountService.getAccountList(
        'STUDENT',
        req,
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        search,
        facultyId,
      );
      return {
        data: studentList,
        message: 'Student account list fetched successfully',
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

  @ApiOperation({ summary: 'Guest account list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('guest-list')
  async guestAccountListFetcher(
    @Req() req: Request,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: 'ALL' | 'ACTIVE' | 'PENDING' | 'INVITED' | 'SUSPENDED',
    @Query('search')
    search?: string,
  ) {
    try {
      const guestList = await this.accountService.getAccountList(
        'GUEST',
        req,
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        search,
      );
      return {
        data: guestList,
        message: 'Guest account list fetched successfully',
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

  @ApiOperation({ summary: 'Admin role list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('role-list')
  async getAccountRole() {
    try {
      const roleList = await this.accountService.getAccountRole();
      return {
        data: roleList,
        message: 'Account role list fetched successfully',
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

  @ApiOperation({ summary: 'Student supervisor list provider' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Get('student-supervisor-list')
  async getStudentSupervisorList(@Req() req: Request) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const supervisorList = await this.accountService.getStudentSuperVisorList(
        student.id,
      );
      return {
        data: supervisorList,
        message: 'Account role list fetched successfully',
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
