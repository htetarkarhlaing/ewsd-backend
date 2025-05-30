import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AdminInviteDTO,
  GuestRegisterDTO,
  StudentRegisterDTO,
  StudentUpdateProfile,
} from './dto';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { Request } from 'express';
import { Account } from '@prisma/client';
import { MailService } from 'src/helper/Mailer';
import { AdminInvitationTemplate } from 'src/helper/template/AdminInvitation';
import { ApprovedStudentRegister } from 'src/helper/template/ApprovedStudentRegister';
import { RejectStudentRegister } from 'src/helper/template/RejectStudentRegister';
import { StudentPasswordReset } from 'src/helper/template/StudentPasswordReset';

@Injectable()
export class AccountService {
  constructor(
    private prisma: PrismaService,
    private mailer: MailService,
  ) {}

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

  async guestRegisterHandler(data: GuestRegisterDTO) {
    try {
      const existingGuest = await this.prisma.account.findFirst({
        where: {
          AND: [{ AccountRoleType: 'GUEST' }, { email: data.email }],
        },
      });

      if (existingGuest) {
        if (existingGuest.AccountStatus === 'ACTIVE') {
          throw new HttpException(
            'Guest already exists',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const guest = await this.prisma.account.create({
        data: {
          username: data.name,
          email: data.email,
          password: hashSync(data.password, genSaltSync()),
          AccountRoleType: 'GUEST',
          AccountStatus: 'ACTIVE',
          AccountInfo: {
            create: {
              name: data.name,
              facultyId: data.facultyId,
            },
          },
        },
      });

      return guest;
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) {
        throw err;
      }

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  async getAccountLoginRecord(id: string) {
    try {
      const loginRecords = await this.prisma.accountLoginLog.findMany({
        where: {
          accountId: id,
        },
        take: 20,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return loginRecords;
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

  async getStudentSuperVisorList(studentId: string) {
    try {
      const targetStudent = await this.prisma.account.findFirst({
        where: {
          id: studentId,
        },
        include: {
          AccountInfo: true,
        },
      });

      if (targetStudent) {
        const supervisorList = await this.prisma.account.findMany({
          where: {
            FacultyAdmin: {
              some: {
                Faculty: {
                  id: targetStudent.AccountInfo?.facultyId as string,
                },
              },
            },
          },
          include: {
            AccountInfo: true,
            FacultyAdmin: {
              include: {
                Faculty: true,
              },
            },
          },
        });
        return supervisorList;
      } else {
        throw new HttpException('Student ID not found', HttpStatus.NOT_FOUND);
      }
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
        include: {
          FacultyAdmin: {
            include: {
              Faculty: true,
            },
          },
        },
      });

      const adminRole = data?.facultyId
        ? 'Marketing Coordinator' + data?.isAdmin
          ? admin?.FacultyAdmin[0]?.Faculty?.name + 'Admin'
          : admin?.FacultyAdmin[0]?.Faculty?.name + 'Member'
        : 'Marketing Manager';

      void this.mailer.sendMail(
        data.email,
        data.name,
        'Management account invitation',
        AdminInvitationTemplate(data.email, data.password, adminRole),
      );

      return admin;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async manageStudentRegister(
    namespace: 'APPROVE' | 'REJECT',
    id: string,
    reason?: string,
  ) {
    try {
      const updatedStudent = await this.prisma.account.update({
        where: {
          id: id,
        },
        data: {
          AccountStatus: namespace === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
        },
        include: {
          AccountInfo: true,
        },
      });

      if (namespace === 'APPROVE') {
        void this.mailer.sendMail(
          updatedStudent.email,
          updatedStudent.AccountInfo?.name as string,
          'Approved student registration',
          ApprovedStudentRegister(),
        );
      } else {
        void this.mailer.sendMail(
          updatedStudent.email,
          updatedStudent.AccountInfo?.name as string,
          'Rejected student registration',
          RejectStudentRegister(reason || 'Unaccepted'),
        );
      }

      return updatedStudent;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async toggleStudent(studentId: string) {
    try {
      const existingStudent = await this.prisma.account.findUnique({
        where: { id: studentId },
      });

      if (!existingStudent) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }

      const updatedStudent = await this.prisma.account.update({
        where: { id: studentId },
        data: {
          AccountStatus:
            existingStudent.AccountStatus === 'SUSPENDED'
              ? 'ACTIVE'
              : 'SUSPENDED',
        },
      });

      return updatedStudent;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteStudent(studentId: string) {
    try {
      const existingStudent = await this.prisma.account.findUnique({
        where: { id: studentId },
      });

      if (!existingStudent) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }

      const updatedStudent = await this.prisma.account.update({
        where: { id: studentId },
        data: {
          AccountStatus: 'PERMANENTLY_DELETED',
        },
      });

      return updatedStudent;
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStudentPassword(
    studentId: string,
    newPassword: string,
    currentPassword?: string,
  ) {
    try {
      const existingStudent = await this.prisma.account.findUnique({
        where: { id: studentId },
        include: {
          AccountInfo: true,
        },
      });

      if (!existingStudent) {
        throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
      }

      if (currentPassword) {
        if (compareSync(currentPassword, existingStudent.password)) {
          const hashedPassword = hashSync(newPassword, genSaltSync());

          await this.prisma.account.update({
            where: { id: studentId },
            data: { password: hashedPassword },
          });

          return {
            message: 'Student password updated successfully!',
            data: null,
          };
        } else {
          throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
        }
      } else {
        const hashedPassword = hashSync(newPassword, genSaltSync());

        await this.prisma.account.update({
          where: { id: studentId },
          data: { password: hashedPassword },
        });

        void this.mailer.sendMail(
          existingStudent.email,
          existingStudent.AccountInfo?.name as string,
          'Student password reset by administrator',
          StudentPasswordReset(existingStudent.email, newPassword),
        );

        return {
          message: 'Student password updated successfully!',
          data: null,
        };
      }
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProfile(
    id: string,
    data: StudentUpdateProfile,
    image: Express.Multer.File,
    req: Request,
  ) {
    try {
      const adminAccount = await this.prisma.account.findFirst({
        where: {
          id,
        },
      });

      if (adminAccount && adminAccount.accountInfoId) {
        const updatedProfile = await this.prisma.accountInfo.update({
          where: {
            id: adminAccount.accountInfoId,
          },
          data: {
            name: data.name,
            ...(image && {
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
            }),
            ...(data.address && {
              address: data.address,
            }),
          },
        });

        return updatedProfile;
      } else {
        throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
      }
    } catch (err) {
      console.error(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
