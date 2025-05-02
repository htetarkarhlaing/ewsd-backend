import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { studentJWTAuthGuard } from 'src/auth/guards/jwt-student-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Account } from '@prisma/client';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('notifications')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch paginated notifications for a student',
    description:
      'Returns a paginated list of notifications for a specific student along with the total notification count, unread count, and a flag indicating if more pages are available.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (default is 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of notifications per page (default is 10)',
    example: 10,
  })
  async getStudentNotifications(
    @Query() query: { page: number; limit: number },
    @Req() req: Request,
  ) {
    try {
      const { page, limit } = query;
      const student = req.user as Omit<Account, 'password'>;
      return await this.notificationService.studentNotiFetcher(
        student.id,
        parseInt(page.toString()),
        parseInt(limit.toString()),
      );
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

  @Put('read-noti/:id')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'mark as read a notification',
  })
  async readTheNoti(@Param('id') id: string) {
    try {
      return await this.notificationService.readNoti(id);
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

  @Put('read-all-noti')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'mark as read all notification',
  })
  async readAllNoti(@Req() req: Request) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      return await this.notificationService.readAllNoti(student.id);
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
}
