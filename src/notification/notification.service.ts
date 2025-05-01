import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async studentNotiFetcher(
    studentId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * parseInt(limit.toString());

      const [notifications, totalCount, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit.toString()),
        }),
        this.prisma.notification.count({
          where: { studentId },
        }),
        this.prisma.notification.count({
          where: { studentId, isRead: false },
        }),
      ]);

      const hasMore = skip + notifications.length < totalCount;

      return {
        notifications,
        totalCount,
        unreadCount,
        hasMore,
      };
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async readNoti(notiId: string) {
    try {
      const existingNoti = await this.prisma.notification.findUnique({
        where: { id: notiId },
      });

      if (!existingNoti) {
        throw new HttpException('Noti not found', HttpStatus.NOT_FOUND);
      }

      const readNoti = await this.prisma.notification.update({
        where: { id: notiId },
        data: {
          isRead: true,
        },
      });

      return readNoti;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async readAllNoti(studentId: string) {
    try {
      const readNoti = await this.prisma.notification.updateMany({
        where: { studentId },
        data: {
          isRead: true,
        },
      });

      return readNoti;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
