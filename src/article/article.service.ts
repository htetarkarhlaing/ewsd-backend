import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { articleDraftDTO } from './dto';
import { Account, ArticleStatus } from '@prisma/client';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async getArticleListByStudentId(
    id: string,
    page = 1,
    limit = 10,
    status: ArticleStatus | 'ALL',
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const [articles, total] = await Promise.all([
        await this.prisma.article.findMany({
          where: {
            AND: [
              {
                UploadedBy: {
                  id,
                },
              },
              {
                ...(search && {
                  OR: [
                    {
                      title: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                }),
              },
              {
                ...(status !== 'ALL' && {
                  ArticleStatus: status,
                }),
              },
            ],
          },
          include: {
            Document: true,
            Event: {
              include: {
                Avatar: true,
              },
            },
            SupervisedBy: {
              include: {
                AccountInfo: {
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
        await this.prisma.article.count({
          where: {
            AND: [
              {
                UploadedBy: {
                  id,
                },
              },
              {
                ...(search && {
                  OR: [
                    {
                      title: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  ],
                }),
              },
              {
                ...(status !== 'ALL' && {
                  ArticleStatus: status,
                }),
              },
            ],
          },
        }),
      ]);

      return {
        data: articles,
        totalItems: total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveDraftArticle(
    data: articleDraftDTO,
    user: Omit<Account, 'password'>,
  ) {
    try {
      const studentFaculty = await this.prisma.accountInfo.findFirst({
        where: {
          id: user.accountInfoId as string,
        },
      });
      if (!studentFaculty) {
        throw new HttpException(
          'Student faculty not found',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        const articles = await this.prisma.article.create({
          data: {
            title: data.title,
            content: data.content,
            ArticleStatus: 'DRAFT',
            UploadedBy: {
              connect: {
                id: user.id,
              },
            },
            Faculty: {
              connect: {
                id: studentFaculty.facultyId as string,
              },
            },
          },
        });

        return articles;
      }
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
