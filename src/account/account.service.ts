import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentRegisterDTO } from './dto';
import { genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async getAccountList(
    namespace: 'ADMIN' | 'STUDENT' | 'GUEST',
    page = 1,
    limit = 10,
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [accounts, total] = await Promise.all([
        this.prisma.account.findMany({
          where: {
            AND: [
              {
                AccountRoleType: namespace,
              },
              {
                AccountStatus: {
                  not: 'PERMANENTLY_DELETED',
                },
              },
              {
                ...(search && {
                  OR: [
                    {
                      AccountInfo: {
                        name: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                      email: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                }),
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
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.account.count({
          where: {
            AND: [
              {
                AccountRoleType: namespace,
              },
              {
                AccountStatus: {
                  not: 'PERMANENTLY_DELETED',
                },
              },
              {
                ...(search && {
                  OR: [
                    {
                      AccountInfo: {
                        name: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                      email: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                }),
              },
            ],
          },
        }),
      ]);

      return {
        data: accounts,
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

  async studentRegisterHandler(data: StudentRegisterDTO) {
    try {
      const existingStudent = await this.prisma.account.findFirst({
        where: {
          AND: [
            {
              AccountRoleType: 'STUDENT',
            },
            {
              email: data.email,
            },
          ],
        },
      });

      if (existingStudent) {
        if (existingStudent.AccountStatus === 'ACTIVE') {
          throw new HttpException(
            'Student already exists',
            HttpStatus.BAD_REQUEST,
          );
        } else if (existingStudent.AccountStatus === 'PENDING') {
          throw new HttpException(
            'Student already exists, please wait for admin approval',
            HttpStatus.BAD_REQUEST,
          );
        }
        throw new HttpException(
          'Please contact admin to activate your account',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        const student = await this.prisma.account.create({
          data: {
            username: data.name,
            email: data.email,
            password: hashSync(data.password, genSaltSync()),
            AccountRoleType: 'STUDENT',
            AccountStatus: 'PENDING',
            AccountInfo: {
              create: {
                name: data.name,
                dateOfBirth: data.dateOfBirth,
                address: data.address,
                Faculty: {
                  connect: {
                    id: data.facultyId,
                  },
                },
                Nationality: {
                  connect: {
                    id: data.nationalityId,
                  },
                },
              },
            },
          },
        });

        return student;
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
}
