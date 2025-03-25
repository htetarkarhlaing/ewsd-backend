import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { eventCreateDTO } from './dto';
import { Account } from '@prisma/client';
import moment from 'moment';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async getEventList(namespace: 'ADMIN' | 'PUBLIC') {
    try {
      const facultyList = await this.prisma.event.findMany({
        where: {
          ...(namespace === 'ADMIN'
            ? {
                Status: {
                  not: 'PERMANENTLY_DELETED',
                },
              }
            : { Status: 'ACTIVE' }),
        },
        include: {
          HostedBy: {
            include: {
              AccountRole: true,
              AccountInfo: {
                include: {
                  Avatar: true,
                },
              },
            },
          },
        },
      });

      return { data: facultyList };
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

  async createEvent(data: eventCreateDTO, req: Request) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const createdFaculty = await this.prisma.event.create({
        data: {
          title: data.title,
          startDate: moment(data.startDate).toISOString(),
          endDate: moment(data.endDate).toISOString(),
          HostedBy: {
            connect: {
              id: admin.id,
            },
          },
        },
        include: {
          HostedBy: {
            include: {
              AccountRole: true,
              AccountInfo: {
                include: {
                  Avatar: true,
                },
              },
            },
          },
        },
      });
      return createdFaculty;
    } catch (err) {
      console.log(err);
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
