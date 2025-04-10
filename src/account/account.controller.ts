import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
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
import { StudentRegisterDTO } from './dto';

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
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search')
    search?: string,
  ) {
    try {
      const adminList = await this.accountService.getAccountList(
        'ADMIN',
        parseInt(page) || 1,
        parseInt(limit) || 10,
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
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    try {
      const studentList = await this.accountService.getAccountList(
        'STUDENT',
        parseInt(page) || 1,
        parseInt(limit) || 10,
        search,
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
