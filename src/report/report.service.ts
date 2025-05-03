import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async fetchDashboardReport() {
    try {
      const [totalStudent, totalAdmin, totalFaculty, totalEvent] =
        await Promise.all([
          await this.prisma.account.count({
            where: {
              AND: [
                {
                  AccountRoleType: 'STUDENT',
                },
                {
                  AccountStatus: 'ACTIVE',
                },
              ],
            },
          }),

          await this.prisma.account.count({
            where: {
              AND: [
                {
                  AccountRoleType: 'ADMIN',
                },
                {
                  AccountStatus: 'ACTIVE',
                },
              ],
            },
          }),

          await this.prisma.faculty.count({
            where: {
              Status: 'ACTIVE',
            },
          }),
          await this.prisma.event.count({
            where: {
              Status: 'ACTIVE',
            },
          }),
        ]);

      return {
        totalStudent,
        totalAdmin,
        totalFaculty,
        totalEvent,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchFacultyPopulation() {
    try {
      const facultyList = await this.prisma.faculty.findMany({
        where: {
          Status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          AccountInfo: {
            where: {
              Account: {
                every: {
                  AND: [
                    {
                      AccountRoleType: 'STUDENT',
                    },
                    {
                      AccountStatus: 'ACTIVE',
                    },
                  ],
                },
              },
            },
            select: {
              id: true,
            },
          },
          FacultyAdmin: {
            where: {
              AND: [
                {
                  Account: {
                    AND: [
                      {
                        AccountRoleType: 'ADMIN',
                      },
                      {
                        AccountStatus: 'ACTIVE',
                      },
                    ],
                  },
                },
                {
                  Account: {
                    AccountRole: {
                      permissions: 'coordinator',
                    },
                  },
                },
              ],
            },
            select: {
              id: true,
            },
          },
        },
      });

      const formattedFacultyList = facultyList.map((faculty) => {
        return {
          id: faculty.id,
          name: faculty.name,
          coordinator: faculty.FacultyAdmin.length,
          student: faculty.AccountInfo.length,
        };
      });

      return formattedFacultyList;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
