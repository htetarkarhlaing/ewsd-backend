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

  fetchFacultyPublication() {
    try {
      // // 1. Group articles by eventId and facultyId with counts
      // const articleCounts = await this.prisma.article.groupBy({
      //   by: ['eventId', 'facultyId'],
      //   _count: {
      //     id: true,
      //   },
      // });
      // // 2. Calculate total articles per event
      // const totalByEvent: Record<string, number> = {};
      // articleCounts.forEach(({ eventId, _count }: { eventId: string }) => {
      //   totalByEvent[eventId] = (totalByEvent[eventId] || 0) + _count.id;
      // });
      // // 3. Add percentages
      // const result = articleCounts.map(({ eventId, facultyId, _count }) => {
      //   const total = totalByEvent[eventId];
      //   const percentage = total > 0 ? (_count.id / total) * 100 : 0;
      //   return {
      //     eventId,
      //     facultyId,
      //     contributionCount: _count.id,
      //     contributionPercentage: Number(percentage.toFixed(2)),
      //   };
      // });
      // return result;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async articleWithEventId(id: string) {
    const articleList = await this.prisma.article.findMany({
      where: {
        AND: [
          {
            ArticleStatus: 'APPROVED',
          },
          {
            eventId: id,
          },
        ],
      },
      select: {
        Document: {
          select: {
            path: true,
          },
        },
      },
    });
    const formattedList: string[] = [];
    articleList.forEach((article) => {
      const filename = article.Document?.path?.split('/').pop() || null;
      if (filename !== null) {
        formattedList.push(filename);
      }
    });

    return formattedList;
  }

  async findArticleById(id: string) {
    const articleList = await this.prisma.article.findMany({
      where: {
        id,
      },
      select: {
        Document: {
          select: {
            path: true,
          },
        },
      },
    });
    const formattedList: string[] = [];
    articleList.forEach((article) => {
      const filename = article.Document?.path?.split('/').pop() || null;
      if (filename !== null) {
        formattedList.push(filename);
      }
    });

    return formattedList;
  }
}
