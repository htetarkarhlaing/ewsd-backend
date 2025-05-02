import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';
import { Account } from '@prisma/client';
import { unset } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GuestService {
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
          secret: this.configService.get('JWT_ACCESS_TOKEN_GUEST'),
          expiresIn: '7d',
        },
      ),
      this.jwtService.signAsync(
        {
          id: id,
        },
        {
          secret: this.configService.get('JWT_REFRESH_TOKEN_GUEST'),
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
            AccountRoleType: 'STUDENT',
          },
        ],
      },
    });
  }

  async validateGuest(
    email: string,
    password: string,
  ): Promise<null | Omit<Account, 'password'>> {
    const student = await this.findOne(email);

    if (!student) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }

    if (student?.AccountStatus === 'PENDING') {
      throw new HttpException(
        'This account is under review. Please wait for admin approval.',
        423,
      );
    }

    if (
      student?.AccountStatus === 'PERMANENTLY_DELETED' ||
      student?.AccountStatus === 'SUSPENDED'
    ) {
      throw new HttpException(
        'This account is locked. Please contact help and support.',
        423,
      );
    }

    if (student && compareSync(password, student.password)) {
      const result = student;
      unset(student, 'password');
      return result;
    }

    if (student && !compareSync(password, student.password)) {
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

  async validateGuestById(
    studentId: string,
  ): Promise<null | Omit<Account, 'password'>> {
    const student = await this.prisma.account.findUnique({
      where: { id: studentId },
    });
    if (student) {
      if (student.AccountStatus !== 'ACTIVE') {
        throw new HttpException(
          'Account is blocked by Administrator',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = student;
      unset(result, 'password');
      return result;
    } else {
      return null;
    }
  }
}
