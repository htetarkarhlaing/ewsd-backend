import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getAccountList(namespace: 'ADMIN' | 'STUDENT' | 'GUEST') {
    try {
      const accountList = await this.prisma.account.findMany({
        where: {
          AND: [
            {
              ...(namespace === 'ADMIN'
                ? {
                    AccountRoleType: 'ADMIN',
                  }
                : namespace === 'STUDENT'
                  ? { AccountRoleType: 'STUDENT' }
                  : { AccountRoleType: 'GUEST' }),
            },
            {
              AccountStatus: {
                not: 'PERMANENTLY_DELETED',
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
          AccountRole: true,
          Faculty: true,
          FacultyAdmin: true,
        },
      });

      return accountList;
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
}
