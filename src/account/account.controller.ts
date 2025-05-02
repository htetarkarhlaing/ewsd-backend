import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { AccountService } from './account.service';
import {
  AdminInviteDTO,
  GuestRegisterDTO,
  manageStudentRegisterDTO,
  StudentRegisterDTO,
  StudentUpdateProfile,
  updatePasswordByAdmin,
  updatePasswordSelf,
  updateProfileDto,
} from './dto';
import { Request } from 'express';
import { studentJWTAuthGuard } from 'src/auth/guards/jwt-student-auth.guard';
import { Account } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

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

  @ApiOperation({ summary: 'Guest registration handler' })
  @Post('guest-register')
  @ApiBody({
    type: GuestRegisterDTO,
    description: 'Guest registration data',
  })
  async guestRegisterHandler(@Body() data: GuestRegisterDTO) {
    try {
      const registeredGuest =
        await this.accountService.guestRegisterHandler(data);
      return {
        data: registeredGuest,
        message:
          'Guest account register submitted successfully. Please wait for admin approval.',
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

  @ApiOperation({ summary: 'Approve student register' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Post('approve-student-register')
  async approveStudentRegister(@Body() data: manageStudentRegisterDTO) {
    try {
      const approvedStudent = await this.accountService.manageStudentRegister(
        'APPROVE',
        data.studentId,
      );
      return {
        data: approvedStudent,
        message: 'Student registration approved successfully',
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

  @ApiOperation({ summary: 'Reject student register' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Post('reject-student-register')
  async rejectStudentRegister(@Body() data: manageStudentRegisterDTO) {
    try {
      const supervisorList = await this.accountService.manageStudentRegister(
        'REJECT',
        data.studentId,
        data.reason,
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

  @Delete('student-delete/:id')
  @ApiOperation({ summary: 'Delete a student account (permanently)' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  async deleteStudent(@Param('id') studentId: string) {
    try {
      const result = await this.accountService.deleteStudent(studentId);
      return {
        message: 'Student deleted successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Delete('student-toggle-lock/:id')
  @ApiOperation({ summary: 'Toggle a student (suspended)' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  async toggleStudent(@Param('id') studentId: string) {
    try {
      const result = await this.accountService.toggleStudent(studentId);
      return {
        message: 'Student account updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post('student-update-password/:id')
  @ApiOperation({ summary: 'Update student password' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: updatePasswordByAdmin,
  })
  async updateStudentPassword(
    @Param('id') student: string,
    @Body() data: updatePasswordByAdmin,
  ) {
    try {
      const result = await this.accountService.updateStudentPassword(
        student,
        data.newPassword,
      );
      return {
        message: 'Student password updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Patch('student-update-password')
  @ApiOperation({ summary: 'Update student password self' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBody({
    type: updatePasswordSelf,
  })
  @ApiBearerAuth()
  async updateStudentPasswordSelf(
    @Body() data: updatePasswordSelf,
    @Req() req: Request,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const result = await this.accountService.updateStudentPassword(
        student.id,
        data.newPassword,
        data.currentPassword,
      );
      return {
        message: 'Student password updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Delete('admin-delete/:id')
  @ApiOperation({ summary: 'Delete a admin account (permanently)' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  async deleteAdmin(@Param('id') studentId: string) {
    try {
      const result = await this.accountService.deleteStudent(studentId);
      return {
        message: 'Admin deleted successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Delete('admin-toggle-lock/:id')
  @ApiOperation({ summary: 'Toggle a admin (suspended)' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  async toggleAdmin(@Param('id') studentId: string) {
    try {
      const result = await this.accountService.toggleStudent(studentId);
      return {
        message: 'Admin account updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Post('admin-update-password/:id')
  @ApiOperation({ summary: 'Update admin password' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: updatePasswordByAdmin,
  })
  async updateAdminPassword(
    @Param('id') student: string,
    @Body() data: updatePasswordByAdmin,
  ) {
    try {
      const result = await this.accountService.updateStudentPassword(
        student,
        data.newPassword,
      );
      return {
        message: 'Admin password updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Patch('admin-update-password')
  @ApiOperation({ summary: 'Update admin password self' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBody({
    type: updatePasswordSelf,
  })
  @ApiBearerAuth()
  async updateAdminPasswordSelf(
    @Body() data: updatePasswordSelf,
    @Req() req: Request,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const result = await this.accountService.updateStudentPassword(
        student.id,
        data.newPassword,
        data.currentPassword,
      );
      return {
        message: 'Admin password updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @ApiOperation({ summary: 'account login log list provider' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Get('student-login-history')
  async getStudentAccountLogin(@Req() req: Request) {
    try {
      const account = req.user as Omit<Account, 'password'>;
      const guestList = await this.accountService.getAccountLoginRecord(
        account.id,
      );
      return {
        data: guestList,
        message: 'account login record fetched successfully',
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

  @ApiOperation({ summary: 'account login log list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('admin-login-history')
  async getAdminAccountLogin(@Req() req: Request) {
    try {
      const account = req.user as Omit<Account, 'password'>;
      const loginRecord = await this.accountService.getAccountLoginRecord(
        account.id,
      );
      return {
        data: loginRecord,
        message: 'account login record fetched successfully',
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

  @Patch('student-update-profile')
  @ApiOperation({ summary: 'Update student profile' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBody({
    type: StudentUpdateProfile,
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateProfileStudent(
    @Body() data: StudentUpdateProfile,
    @Req() req: Request,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const result = await this.accountService.updateProfile(
        student.id,
        data,
        image,
        req,
      );
      return {
        message: 'Student profile updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @Patch('admin-update-profile')
  @ApiOperation({ summary: 'Update admin profile' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBody({
    type: updateProfileDto,
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateProfileAdmin(
    @Body() data: updateProfileDto,
    @Req() req: Request,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const result = await this.accountService.updateProfile(
        student.id,
        data as StudentUpdateProfile,
        image,
        req,
      );
      return {
        message: 'Account profile updated successfully',
        data: result,
      };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
