import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
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
  ApiTags,
} from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { eventCreateDTO } from './dto';
import { Request } from 'express';
import { EventService } from './event.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Event')
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({ summary: 'Admin event list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('list-admin')
  async adminEventListFetcher(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: 'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'SUSPENDED',
    @Query('search') search?: string,
  ) {
    try {
      const eventList = await this.eventService.getEventList(
        'ADMIN',
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        search,
      );
      return {
        data: eventList,
        message: 'Admin event list fetched successfully',
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

  @ApiOperation({ summary: 'Event list provider' })
  @Get('list-public')
  async eventListFetcher(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: 'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'SUSPENDED',
    @Query('search') search?: string,
  ) {
    try {
      const eventList = await this.eventService.getEventList(
        'PUBLIC',
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        search,
      );
      return {
        data: eventList,
        message: 'Event list fetched successfully',
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

  @ApiOperation({ summary: 'Event list public provider not pagination' })
  @Get('list-public-no-pagination')
  async eventListFetcherNoPagination() {
    try {
      const eventList = await this.eventService.getEventListNoPagination();
      return {
        data: eventList,
        message: 'Event list fetched successfully',
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

  @Post('create')
  @ApiOperation({ summary: 'create event' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: eventCreateDTO })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
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
  async createEvent(
    @Body() data: eventCreateDTO,
    @Req() req: Request,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const createdEvent = await this.eventService.createEvent(
        data,
        image,
        req,
      );
      return {
        data: createdEvent,
        message: 'Event created successfully',
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
