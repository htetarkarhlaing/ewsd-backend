import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { studentJWTAuthGuard } from 'src/auth/guards/jwt-student-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Account } from '@prisma/client';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { ChatRoomCreateDto, sendMessageDto } from './dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('student-messages')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch paginated messages for a student',
    description:
      'Returns a paginated list of messages for a specific student along with the total notification count, unread count, and a flag indicating if more pages are available.',
  })
  @ApiQuery({
    name: 'roomId',
    required: true,
    description: 'Chat room Id for chat message fetcher',
    example: 1,
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
    description: 'Number of messages per page (default is 10)',
    example: 10,
  })
  async getStudentChatMessages(
    @Query() query: { roomId: string; page: number; limit: number },
    @Req() req: Request,
  ) {
    try {
      const { page, limit } = query;
      const student = req.user as Omit<Account, 'password'>;
      return await this.chatService.chatMessageFetcher(
        query.roomId,
        student.id,
        page,
        limit,
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

  @Get('admin-messages')
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fetch paginated messages for a admin',
    description:
      'Returns a paginated list of messages for a specific admin along with the total notification count, unread count, and a flag indicating if more pages are available.',
  })
  @ApiQuery({
    name: 'roomId',
    required: true,
    description: 'Chat room Id for chat message fetcher',
    example: 1,
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
    description: 'Number of messages per page (default is 10)',
    example: 10,
  })
  async getAdminChatMessages(
    @Query() query: { roomId: string; page: number; limit: number },
    @Req() req: Request,
  ) {
    try {
      const { page, limit } = query;
      const admin = req.user as Omit<Account, 'password'>;
      return await this.chatService.chatMessageFetcher(
        query.roomId,
        admin.id,
        page,
        limit,
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

  @Put('student-create-chat-room')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'mark as read all notification',
  })
  async studentCreateChatRoom(@Req() req: Request) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      return await this.chatService.readMessage(student.id);
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

  @Put('student-read-all-message')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'mark as read all notification',
  })
  async studentReadAllNoti(@Req() req: Request) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      return await this.chatService.readMessage(student.id);
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

  @Put('admin-read-all-message')
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'mark as read all notification',
  })
  async readAllNoti(@Req() req: Request) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      return await this.chatService.readMessage(admin.id);
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

  @Post('student-create-chat-room')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'create chat room by student',
  })
  @ApiBody({
    type: ChatRoomCreateDto,
  })
  async createChatRoomByStudent(@Body() data: ChatRoomCreateDto) {
    try {
      return await this.chatService.createChatRoom(
        data.studentId,
        data.adminId,
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

  @Post('admin-create-chat-room')
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'create chat room by admin',
  })
  @ApiBody({
    type: ChatRoomCreateDto,
  })
  async createChatRoomByAdmin(@Body() data: ChatRoomCreateDto) {
    try {
      return await this.chatService.createChatRoom(
        data.studentId,
        data.adminId,
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

  @Post('admin-send-message')
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'send chat room message by admin',
  })
  @ApiBody({
    type: sendMessageDto,
  })
  async createChatRoomMessageByAdmin(
    @Body() data: sendMessageDto,
    @Req() req: Request,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      return await this.chatService.sendMessage(
        admin.id,
        data.chatRoomId,
        data.message,
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

  @Post('student-send-message')
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'send chat room message by student',
  })
  @ApiBody({
    type: sendMessageDto,
  })
  async createChatRoomMessageByStudent(
    @Body() data: sendMessageDto,
    @Req() req: Request,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      return await this.chatService.sendMessage(
        student.id,
        data.chatRoomId,
        data.message,
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
}
