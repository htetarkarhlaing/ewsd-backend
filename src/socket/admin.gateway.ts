import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'admin',
  cors: {
    origin: '*',
  },
})
export class AdminSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, Set<string>>();

  onModuleInit() {
    this.activeUsers.clear();
    Logger.log(`🧹 Cleared all active users on module initialization`);
  }

  afterInit() {
    Logger.log(`🔗 Socket is running.`);
  }

  handleConnection(client: Socket) {
    this.addConnectedUser(client);
    Logger.log(`🟢 Admin Client with socket ID: ${client.id} connected.`);
  }

  private addConnectedUser(client: Socket) {
    const clientId = client.id;
    const token = this.extractTokenFromHandshake(client);

    if (!token) {
      client.disconnect();
      return;
    }

    const secret = process.env.JWT_ACCESS_TOKEN_ADMIN;

    try {
      const payload = this.jwtService.verify(token, { secret });
      const userId = payload.id;
      if (!this.activeUsers.has(userId)) {
        this.activeUsers.set(userId, new Set());
      }

      this.activeUsers.get(userId)!.add(clientId);

      Logger.log(`✅ User ${userId} added with socket ID ${clientId}`);
      this.broadcastActiveStudent();
    } catch (error) {
      Logger.error(
        `❌ Failed to add user with socket ID ${clientId}`,
        error.message,
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.removeConnectedUser(client);
    Logger.log(`🔴 Client with socket ID: ${client.id} disconnected.`);
  }

  private removeConnectedUser(client: Socket) {
    const clientId = client.id;

    for (const [userId, clientIds] of this.activeUsers.entries()) {
      if (clientIds.has(clientId)) {
        clientIds.delete(clientId);
        Logger.log(`🗑️ Removed socket ${clientId} for user ${userId}`);

        if (clientIds.size === 0) {
          this.activeUsers.delete(userId);
        }

        this.broadcastActiveStudent();

        break;
      }
    }
  }

  getTarget(userId: string): string[] {
    return Array.from(this.activeUsers.get(userId) || []);
  }

  notification(id: string, message: any) {
    const clientIds = this.getTarget(id);
    for (const clientId of clientIds) {
      this.server.to(clientId).emit('new-message', message);
    }
  }

  @SubscribeMessage('get-active-admin')
  getActiveAdmin(client: Socket) {
    client.emit('active-admin-list', this.getAllActiveAdmin());
  }

  private getAllActiveAdmin(): { userId: string; connections: number }[] {
    return Array.from(this.activeUsers.entries()).map(
      ([userId, clientIds]) => ({
        userId,
        connections: clientIds.size,
      }),
    );
  }

  private broadcastActiveStudent() {
    this.server.emit('active-admin-list', this.getAllActiveAdmin());
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    return client.handshake.auth.token;
  }
}
