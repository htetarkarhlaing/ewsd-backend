import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminInviteDTO, StudentRegisterDTO } from './dto';
import { genSaltSync, hashSync } from 'bcrypt';
import { Request } from 'express';
import { Account } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  private async studentIdGenerator(): Promise<string> {
    const words = 'AHU';

    const result = Math.floor(1000 + Math.random() * 9000).toString();
    const studentIdCode = words + result;

    const existingLoginCode = await this.prisma.accountInfo.findFirst({
      where: {
        studentId: studentIdCode,
      },
    });

    if (existingLoginCode) {
      return this.studentIdGenerator();
    }

    return studentIdCode;
  }

  async getAccountList(
    namespace: 'ADMIN' | 'STUDENT' | 'GUEST',
    req: Request,
    page = 1,
    limit = 10,
    status: 'ALL' | 'ACTIVE' | 'PENDING' | 'INVITED' | 'REJECTED' | 'SUSPENDED',
    search?: string,
    facultyId?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      let roleList: null | string[] = null;

      if (namespace === 'ADMIN') {
        const user = req.user as Omit<Account, 'password'>;
        const dbRoleList = await this.prisma.accountRole.findMany({
          where: {
            Status: 'ACTIVE',
          },
        });
        const adminRole = await this.prisma.accountRole.findFirst({
          where: {
            Account: {
              every: {
                id: user.id,
              },
            },
          },
          select: {
            permissions: true,
          },
        });

        if (adminRole) {
          if (adminRole.permissions === '*') {
            roleList = dbRoleList.map((role) => role.id);
          } else if (adminRole.permissions === 'manager') {
            roleList = dbRoleList
              .filter((role) => role.permissions === 'coordinator')
              .map((role) => role.id);
          }
        }
      }

      const [accounts, total] = await Promise.all([
        this.prisma.account.findMany({
          where: {
            AND: [
              {
                AccountRoleType: namespace,
              },
              {
                ...(roleList !== null && {
                  accountRoleId: {
                    in: roleList,
                  },
                }),
              },
              {
                ...(facultyId && {
                  AccountInfo: {
                    facultyId: facultyId,
                  },
                }),
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
                      username: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
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
                ...(status !== 'ALL' && {
                  AccountStatus: status,
                }),
              },
            ],
          },
          include: {
            AccountInfo: {
              include: {
                Avatar: true,
                Nationality: {
                  include: {
                    Avatar: true,
                  },
                },
                Faculty: {
                  include: {
                    Avatar: true,
                  },
                },
              },
            },
            AccountRole: true,
            FacultyAdmin: {
              include: {
                Faculty: {
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
                ...(roleList !== null && {
                  accountRoleId: {
                    in: roleList,
                  },
                }),
              },
              {
                ...(facultyId && {
                  AccountInfo: {
                    facultyId: facultyId,
                  },
                }),
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
                studentId: await this.studentIdGenerator(),
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

  async getAccountRole() {
    try {
      const accountList = await this.prisma.accountRole.findMany({
        where: {
          Status: 'ACTIVE',
        },
      });

      return accountList;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async inviteAdmin(data: AdminInviteDTO) {
    try {
      const existingAdmin = await this.prisma.account.findFirst({
        where: {
          AND: [
            {
              AccountRoleType: 'ADMIN',
            },
            {
              email: data.email,
            },
          ],
        },
      });
      if (existingAdmin) {
        if (existingAdmin.AccountStatus === 'ACTIVE') {
          throw new HttpException(
            'User already exists',
            HttpStatus.BAD_REQUEST,
          );
        } else if (existingAdmin.AccountStatus === 'INVITED') {
          throw new HttpException(
            'User already invited, please contact for further process.',
            HttpStatus.BAD_REQUEST,
          );
        } else if (existingAdmin.AccountStatus === 'SUSPENDED') {
          throw new HttpException(
            'User already suspended, please check the user list to manage.',
            HttpStatus.BAD_REQUEST,
          );
        }
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }

      const admin = await this.prisma.account.create({
        data: {
          username: data.name,
          email: data.email,
          password: hashSync(data.password, genSaltSync()),
          AccountRoleType: 'ADMIN',
          AccountStatus: 'INVITED',
          AccountRole: {
            connect: {
              id: data.roleId,
            },
          },
          AccountInfo: {
            create: {
              name: data.name,
            },
          },
          ...(data.facultyId && {
            FacultyAdmin: {
              create: {
                Faculty: {
                  connect: {
                    id: data.facultyId,
                  },
                },
                FacultyRole: data.isAdmin === true ? 'ADMIN' : 'MEMBER',
              },
            },
          }),
        },
      });

      return admin;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
