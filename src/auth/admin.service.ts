import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';
import { Account } from '@prisma/client';
import { unset } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  // ? --------------------------------------- Helper functions --------------------------------------------------
  private async generateTokens(id: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id,
        },
        {
          secret: this.configService.get('JWT_ACCESS_TOKEN_ADMIN'),
          expiresIn: '1d',
        },
      ),
      this.jwtService.signAsync(
        {
          id: id,
        },
        {
          secret: this.configService.get('JWT_REFRESH_TOKEN_ADMIN'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  // ? --------------------------------------- Service functions --------------------------------------------------
  async findOne(email: string) {
    return this.prisma.account.findFirst({
      where: {
        AND: [
          {
            OR: [
              {
                email,
              },
              {
                username: email,
              },
            ],
          },
          {
            AccountRoleType: 'ADMIN',
          },
        ],
      },
    });
  }

  async validateAdmin(
    email: string,
    password: string,
  ): Promise<null | Omit<Account, 'password'>> {
    const admin = await this.findOne(email);

    if (!admin) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    if (
      admin?.AccountStatus === 'PERMANENTLY_DELETED' ||
      admin?.AccountStatus === 'SUSPENDED'
    ) {
      throw new HttpException(
        'This account is locked. Please contact help and support.',
        423,
      );
    }

    if (admin && compareSync(password, admin.password)) {
      const result = admin;
      unset(admin, 'password');
      return result;
    }

    if (admin && !compareSync(password, admin.password)) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    return null;
  }

  async loginService(
    admin: Omit<Account, 'password'>,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const generatedTokens = await this.generateTokens(admin.id);
      if (generatedTokens) {
        return generatedTokens;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
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

  async validateAdminById(
    adminId: string,
  ): Promise<null | Omit<Account, 'password'>> {
    const admin = await this.prisma.account.findUnique({
      where: { id: adminId },
    });
    if (admin) {
      if (admin.AccountStatus !== 'ACTIVE') {
        throw new HttpException(
          'Account is blocked by Administrator',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = admin;
      unset(result, 'password');
      return result;
    } else {
      return null;
    }
  }

  async adminInfoProvider(
    admin: Omit<Account, 'password'>,
  ): Promise<null | Omit<Account, 'password'>> {
    try {
      const adminInfo = await this.prisma.account.findUnique({
        where: {
          id: admin.id,
        },
      });
      return adminInfo;
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

  async infoProvider(account: Omit<Account, 'password'>) {
    try {
      const adminInfo = await this.prisma.account.findUnique({
        where: {
          id: account.id,
        },
        include: {
          AccountInfo: {
            include: {
              Avatar: true,
            },
          },
          AccountRole: true,
        },
      });
      return adminInfo;
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
