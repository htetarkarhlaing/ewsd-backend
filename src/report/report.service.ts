import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as moment from 'moment';

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

  private generateColorFromCode(code: string): string {
    // 1) Compute a simple integer hash:
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }

    // 2) Golden ratio constant:
    const goldenRatioConjugate = 0.618033988749895;

    // 3) Multiply hash by φ, take fractional part in [0,1):
    let frac = (hash * goldenRatioConjugate) % 1;
    if (frac < 0) frac += 1;

    // 4) Map that to the blue hue range [200°,240°):
    const hueStart = 200;
    const hueEnd = 240;
    const hue = hueStart + frac * (hueEnd - hueStart);

    // 5) Return a vivid HSL blue:
    return `hsl(${hue.toFixed(1)}, 70%, 55%)`;
  }

  async fetchFacultyArticleStatus(eventId: string) {
    try {
      const fourteenDaysAgo = moment().subtract(14, 'days').toDate();

      const faculties = await this.prisma.faculty.findMany({
        select: { name: true },
      });

      const pendingArticles = await this.prisma.article.findMany({
        where: {
          AND: [
            {
              eventId,
            },
            {
              ArticleStatus: 'PENDING',
            },
          ],
        },
        select: {
          createdAt: true,
          Faculty: {
            select: {
              name: true,
            },
          },
        },
      });

      const grouped = new Map<
        string,
        { faculty: string; noCmt: number; noCmtOverDue: number }
      >();

      for (const article of pendingArticles) {
        const facultyName = article.Faculty?.name ?? 'Unknown Faculty';
        const isOverdue = moment(article.createdAt).isBefore(fourteenDaysAgo);

        if (!grouped.has(facultyName)) {
          grouped.set(facultyName, {
            faculty: facultyName,
            noCmt: 0,
            noCmtOverDue: 0,
          });
        }

        const group = grouped.get(facultyName)!;
        group.noCmt += 1;
        if (isOverdue) group.noCmtOverDue += 1;
      }

      for (const faculty of faculties) {
        if (!grouped.has(faculty.name)) {
          grouped.set(faculty.name, {
            faculty: faculty.name,
            noCmt: 0,
            noCmtOverDue: 0,
          });
        }
      }

      return Array.from(grouped.values());
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchFacultyPublication(eventId: string) {
    try {
      const articles = await this.prisma.article.findMany({
        where: {
          AND: [
            {
              ArticleStatus: {
                notIn: [
                  'CANCELLED',
                  'DRAFT',
                  'NEED_ACTION',
                  'PERMANENTLY_DELETED',
                  'REJECTED',
                ],
              },
            },
            {
              eventId,
            },
          ],
        },
        select: {
          facultyId: true,
          uploadedById: true,
        },
      });

      const facultyStats = new Map<
        string,
        { contributions: number; contributorSet: Set<string> }
      >();

      for (const article of articles) {
        const facultyId = article.facultyId;
        if (!facultyId) continue;

        if (!facultyStats.has(facultyId)) {
          facultyStats.set(facultyId, {
            contributions: 0,
            contributorSet: new Set(),
          });
        }

        const stats = facultyStats.get(facultyId)!;
        stats.contributions += 1;
        if (article.uploadedById) {
          stats.contributorSet.add(article.uploadedById);
        }
      }

      const faculties = await this.prisma.faculty.findMany({
        select: {
          id: true,
          facultyCode: true,
          name: true,
        },
      });

      const chartData: {
        faculty: string;
        contributions: number;
        contributor: number;
        fill: string;
      }[] = [];

      const facultyMap: Record<
        string,
        {
          label: string;
          color: string;
        }
      > = {};

      for (const faculty of faculties) {
        const { id, facultyCode, name } = faculty;
        const stat = facultyStats.get(id);
        const fill = this.generateColorFromCode(facultyCode);

        chartData.push({
          faculty: facultyCode,
          contributions: stat?.contributions ?? 0,
          contributor: stat?.contributorSet.size ?? 0,
          fill,
        });

        facultyMap[facultyCode] = {
          label: name,
          color: fill,
        };
      }

      return {
        chartData,
        facultyMap,
      };
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
