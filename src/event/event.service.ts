import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { eventCreateDTO } from './dto';
import { Account } from '@prisma/client';
import * as moment from 'moment';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async getEventList(
    namespace: 'ADMIN' | 'PUBLIC',
    page = 1,
    limit = 10,
    status: 'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'SUSPENDED',
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const [events, total] = await Promise.all([
        await this.prisma.event.findMany({
          where: {
            AND: [
              {
                ...(namespace === 'PUBLIC' && {
                  Status: {
                    not: 'SUSPENDED',
                  },
                }),
              },
              {
                ...(search && {
                  OR: [
                    {
                      title: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      description: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                }),
              },
              {
                ...(status !== 'ALL' && {
                  Status: status,
                }),
              },
            ],
          },
          include: {
            Avatar: true,
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
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        await this.prisma.event.count({
          where: {
            AND: [
              {
                ...(namespace === 'PUBLIC' && {
                  Status: {
                    not: 'SUSPENDED',
                  },
                }),
              },
              {
                ...(search && {
                  OR: [
                    {
                      title: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                    {
                      description: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                }),
              },
              {
                ...(status !== 'ALL' && {
                  Status: status,
                }),
              },
            ],
          },
        }),
      ]);

      return {
        data: events,
        totalItems: total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit),
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

  async getEventListNoPagination() {
    try {
      const eventList = await this.prisma.event.findMany({
        where: {
          Status: 'ACTIVE',
        },
      });

      return eventList;
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

  async createEvent(
    data: eventCreateDTO,
    image: Express.Multer.File,
    req: Request,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const createdFaculty = await this.prisma.event.create({
        data: {
          title: data.title,
          description: data.description,
          startDate: moment(data.startDate).toISOString(),
          closureDate: moment(data.closureDate).toISOString(),
          endDate: moment(data.endDate).toISOString(),
          Avatar: {
            create: {
              name: image.originalname,
              path:
                process.env.NODE_ENV === 'development'
                  ? `${req.protocol}://localhost:8000/files/${image.filename}`
                  : `${req.protocol}s://${req.hostname}/files/${image.filename}`,
              type: image.mimetype,
            },
          },
          HostedBy: {
            connect: {
              id: admin.id,
            },
          },
        },
        include: {
          Avatar: true,
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
