import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocketGateway } from 'src/socket/gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async chatMessageFetcher(
    chatRoomId: string,
    fetcherId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * parseInt(limit.toString());

      const [chatMessageLength, totalCount, unreadCount] = await Promise.all([
        this.prisma.chatMessage.findMany({
          where: { chatRoomId },
          orderBy: { createdAt: 'desc' },
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

      const hasMore = skip + chatMessageLength.length < totalCount;

      return {
        chatMessageLength,
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
            message: content,
            isRead: true,
          },
        });

        const receiverId =
          targetChatRoom?.studentId === senderId
            ? targetChatRoom.adminId
            : targetChatRoom.studentId;

        this.socketGateway.notification(receiverId, {
          messageId: createdChatMessage.id,
          content: createdChatMessage.message,
        });

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
