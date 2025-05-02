import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminSocketGateway } from 'src/socket/admin.gateway';
import { StudentSocketGateway } from 'src/socket/student.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private adminSocketGateway: AdminSocketGateway,
    private studentSocketGateway: StudentSocketGateway,
  ) {}

  async adminInboxStudentList(facultyId: string) {
    try {
      const studentList = await this.prisma.account.findMany({
        where: {
          AND: [
            {
              AccountStatus: 'ACTIVE',
            },
            {
              AccountRoleType: 'STUDENT',
            },
            {
              Faculty: {
                every: {
                  id: facultyId,
                },
              },
            },
          ],
        },
        include: {
          AccountInfo: {
            include: {
              Avatar: true,
            },
          },
        },
      });

      return studentList;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async chatMessageFetcher(
    chatRoomId: string,
    fetcherId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * parseInt(limit.toString());

      const [data, totalCount, unreadCount] = await Promise.all([
        this.prisma.chatMessage.findMany({
          where: { chatRoomId },
          orderBy: { createdAt: 'asc' },
          skip,
          take: parseInt(limit.toString()),
        }),
        this.prisma.chatMessage.count({
          where: {
            chatRoomId,
          },
        }),
        this.prisma.chatMessage.count({
          where: {
            AND: [
              {
                chatRoomId,
              },
              {
                senderId: {
                  not: fetcherId,
                },
              },
              {
                isRead: false,
              },
            ],
          },
        }),
      ]);

      const hasMore = skip + data.length < totalCount;

      return {
        data,
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

  async sendMessage(senderId: string, roomId: string, content: string) {
    try {
      const targetChatRoom = await this.prisma.chatRoom.findFirst({
        where: {
          id: roomId,
        },
      });

      if (targetChatRoom) {
        const createdChatMessage = await this.prisma.chatMessage.create({
          data: {
            ChatRoom: {
              connect: {
                id: targetChatRoom.id,
              },
            },
            Sender: {
              connect: {
                id: senderId,
              },
            },
            content: content,
            isRead: false,
          },
          include: {
            Sender: {
              include: {
                AccountInfo: {
                  include: {
                    Avatar: true,
                  },
                },
              },
            },
          },
        });

        if (targetChatRoom?.studentId === senderId) {
          this.adminSocketGateway.notification(targetChatRoom?.adminId, {
            message: createdChatMessage,
          });
        } else {
          this.studentSocketGateway.notification(targetChatRoom?.studentId, {
            message: createdChatMessage,
          });
        }

        return createdChatMessage;
      } else {
        throw new HttpException('Chat room not found', HttpStatus.NOT_FOUND);
      }
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createChatRoom(studentId: string, adminId: string) {
    try {
      const existingChatRoom = await this.prisma.chatRoom.findFirst({
        where: {
          AND: [
            {
              adminId,
            },
            {
              studentId,
            },
            {
              Status: 'ACTIVE',
            },
          ],
        },
      });

      if (existingChatRoom) {
        return existingChatRoom;
      } else {
        const createdChatRoom = await this.prisma.chatRoom.create({
          data: {
            Admin: {
              connect: {
                id: adminId,
              },
            },
            Student: {
              connect: {
                id: studentId,
              },
            },
          },
        });

        return createdChatRoom;
      }
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async readMessage(senderId: string) {
    try {
      const readChatMessage = await this.prisma.chatMessage.updateMany({
        where: {
          senderId: {
            not: senderId,
          },
        },
        data: {
          isRead: true,
        },
      });

      return readChatMessage;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchChatMessageById(id: string) {
    try {
      const chatMessage = await this.prisma.chatMessage.findFirst({
        where: { id },
      });

      return chatMessage;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
