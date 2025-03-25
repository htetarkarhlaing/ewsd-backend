import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { eventCreateDTO } from './dto';
import { Request } from 'express';
import { EventService } from './event.service';

@ApiTags('Event')
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiOperation({ summary: 'Admin event list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('list-admin')
  async adminEventListFetcher() {
    try {
      const eventList = await this.eventService.getEventList('ADMIN');
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
  async eventListFetcher() {
    try {
      const eventList = await this.eventService.getEventList('PUBLIC');
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
  @ApiBody({ type: eventCreateDTO })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  async createEvent(@Body() data: eventCreateDTO, @Req() req: Request) {
    try {
      const createdEvent = await this.eventService.createEvent(data, req);
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
