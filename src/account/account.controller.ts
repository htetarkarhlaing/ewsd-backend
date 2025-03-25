import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { AccountService } from './account.service';

@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @ApiOperation({ summary: 'Admin account list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('admin-list')
  async adminAccountListFetcher() {
    try {
      const adminList = await this.accountService.getAccountList('ADMIN');
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
  async studentAccountListFetcher() {
    try {
      const studentList = await this.accountService.getAccountList('STUDENT');
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
  async guestAccountListFetcher() {
    try {
      const guestList = await this.accountService.getAccountList('GUEST');
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
}
