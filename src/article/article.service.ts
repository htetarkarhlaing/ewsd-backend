import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { articleDraftDTO, articleUploadDTO } from './dto';
import { Account, ArticleStatus } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  async getArticleListByAdminId(
    id: string,
    page = 1,
    limit = 10,
    status: ArticleStatus | 'ALL',
    faculty?: string,
    event?: string,
    search?: string,
  ) {
    try {
      const currentAdmin = await this.prisma.account.findFirst({
        where: {
          id,
        },
        select: {
          AccountRole: {
            select: {
              permissions: true,
            },
          },
          FacultyAdmin: {
            select: {
              facultyId: true,
            },
          },
        },
      });

      const isCoordinator =
        currentAdmin && currentAdmin.AccountRole?.permissions === 'coordinator';

      const skip = (page - 1) * limit;
      const [articles, total] = await Promise.all([
        await this.prisma.article.findMany({
          where: {
            AND: [
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
                ...(status !== 'ALL'
                  ? {
                      ArticleStatus: status,
                    }
                  : {
                      ArticleStatus: {
                        notIn: ['DRAFT', 'PERMANENTLY_DELETED'],
                      },
                    }),
              },
              {
                ...(faculty
                  ? {
                      UploadedBy: {
                        AccountInfo: {
                          Faculty: {
                            id: faculty,
                          },
                        },
                      },
                    }
                  : isCoordinator &&
                    currentAdmin?.FacultyAdmin[0]?.facultyId && {
                      UploadedBy: {
                        AccountInfo: {
                          Faculty: {
                            id: currentAdmin?.FacultyAdmin[0]?.facultyId,
                          },
                        },
                      },
                    }),
              },
              {
                ...(event && {
                  eventId: event,
                }),
              },
            ],
          },
          include: {
            Faculty: true,
            ArticleLog: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            Document: true,
            Thumbnail: true,
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
            UploadedBy: {
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
            updatedAt: 'desc',
          },
        }),
        await this.prisma.article.count({
          where: {
            AND: [
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
                ...(status !== 'ALL'
                  ? {
                      ArticleStatus: status,
                    }
                  : {
                      ArticleStatus: {
                        notIn: ['DRAFT', 'PERMANENTLY_DELETED'],
                      },
                    }),
              },
              {
                ...(faculty
                  ? {
                      UploadedBy: {
                        AccountInfo: {
                          Faculty: {
                            id: faculty,
                          },
                        },
                      },
                    }
                  : isCoordinator &&
                    currentAdmin?.FacultyAdmin[0]?.facultyId && {
                      UploadedBy: {
                        AccountInfo: {
                          Faculty: {
                            id: currentAdmin?.FacultyAdmin[0]?.facultyId,
                          },
                        },
                      },
                    }),
              },
              {
                ...(event && {
                  eventId: event,
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
                ArticleStatus: {
                  not: 'PERMANENTLY_DELETED',
                },
              },
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
            ArticleLog: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            Document: true,
            Thumbnail: true,
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
            updatedAt: 'desc',
          },
        }),
        await this.prisma.article.count({
          where: {
            AND: [
              {
                ArticleStatus: {
                  not: 'PERMANENTLY_DELETED',
                },
              },
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

  async getArticleDetail(id: string) {
    try {
      const articleData = await this.prisma.article.findFirst({
        where: {
          id,
        },
        include: {
          Thumbnail: true,
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
          ArticleLog: true,
        },
      });
      return articleData;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getArticleList(page = 1, limit = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      const [articles, total] = await Promise.all([
        await this.prisma.article.findMany({
          where: {
            AND: [
              {
                ArticleStatus: 'APPROVED',
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
            ],
          },
          include: {
            Thumbnail: true,
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
                ArticleStatus: 'APPROVED',
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
    req: Request,
    thumbnail?: Express.Multer.File,
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
            ...(thumbnail && {
              Thumbnail: {
                create: {
                  name: thumbnail.originalname,
                  path:
                    process.env.NODE_ENV === 'development'
                      ? `${req.protocol}://localhost:8000/files/${thumbnail.filename}`
                      : `${req.protocol}s://${req.hostname}/files/${thumbnail.filename}`,
                  type: thumbnail.mimetype,
                },
              },
            }),
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

  async updateDraftArticle(
    data: articleDraftDTO,
    user: Omit<Account, 'password'>,
    id: string,
    req: Request,
    thumbnail?: Express.Multer.File,
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
        const articles = await this.prisma.article.update({
          where: {
            id: id,
          },
          data: {
            title: data.title,
            content: data.content,
            ...(thumbnail && {
              Thumbnail: {
                create: {
                  name: thumbnail.originalname,
                  path:
                    process.env.NODE_ENV === 'development'
                      ? `${req.protocol}://localhost:8000/files/${thumbnail.filename}`
                      : `${req.protocol}s://${req.hostname}/files/${thumbnail.filename}`,
                  type: thumbnail.mimetype,
                },
              },
            }),
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

  async uploadArticle(
    data: articleUploadDTO,
    user: Omit<Account, 'password'>,
    req: Request,
    doc: Express.Multer.File,
    thumbnail?: Express.Multer.File,
  ) {
    try {
      if (data.articleId && data.articleId !== '') {
        const targetEvent = await this.prisma.event.findFirst({
          where: {
            id: data.eventId,
          },
        });

        const article = await this.prisma.article.findFirst({
          where: {
            id: data.articleId,
          },
        });
        if (!article) {
          throw new HttpException('Article not found', HttpStatus.BAD_REQUEST);
        }

        const updatedArticle = await this.prisma.article.update({
          where: {
            id: data.articleId,
          },
          data: {
            title: data.title,
            content: data.content,
            ArticleStatus: 'PENDING',
            Event: {
              connect: {
                id: data.eventId,
              },
            },
            isOverdue:
              new Date(targetEvent?.deadline || '').getTime() >
              new Date().getTime()
                ? false
                : true,
            ...(thumbnail && {
              Thumbnail: {
                create: {
                  name: thumbnail.originalname,
                  path:
                    process.env.NODE_ENV === 'development'
                      ? `${req.protocol}://localhost:8000/files/${thumbnail.filename}`
                      : `${req.protocol}s://${req.hostname}/files/${thumbnail.filename}`,
                  type: thumbnail.mimetype,
                },
              },
            }),
            Document: {
              create: {
                name: doc.originalname,
                path:
                  process.env.NODE_ENV === 'development'
                    ? `${req.protocol}://localhost:8000/files/${doc.filename}`
                    : `${req.protocol}s://${req.hostname}/files/${doc.filename}`,
                type: doc.mimetype,
              },
            },
          },
        });

        return updatedArticle;
      } else {
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
              ArticleStatus: 'PENDING',
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
              Event: {
                connect: {
                  id: data.eventId,
                },
              },
              Document: {
                create: {
                  name: doc.originalname,
                  path:
                    process.env.NODE_ENV === 'development'
                      ? `${req.protocol}://localhost:8000/files/${doc.filename}`
                      : `${req.protocol}s://${req.hostname}/files/${doc.filename}`,
                  type: doc.mimetype,
                },
              },
            },
          });

          return articles;
        }
      }
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteDraftArticle(id: string) {
    try {
      const targetArticle = await this.prisma.article.findFirst({
        where: {
          id,
        },
      });

      if (targetArticle) {
        if (targetArticle.ArticleStatus === 'DRAFT') {
          await this.prisma.article.update({
            where: {
              id,
            },
            data: {
              ArticleStatus: 'PERMANENTLY_DELETED',
            },
          });
          return 'Draft article deleted successfully';
        } else {
          throw new HttpException(
            'Uploaded article cannot delete',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        throw new HttpException(
          'Article not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancelUploadedArticle(id: string) {
    try {
      const targetArticle = await this.prisma.article.findFirst({
        where: {
          id,
        },
      });

      if (targetArticle) {
        if (
          targetArticle.ArticleStatus !== 'DRAFT' &&
          targetArticle.ArticleStatus !== 'APPROVED'
        ) {
          await this.prisma.article.update({
            where: {
              id,
            },
            data: {
              ArticleStatus: 'CANCELLED',
            },
          });
          return 'Article cancelled successfully';
        } else {
          throw new HttpException(
            'Approved article cannot delete',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        throw new HttpException(
          'Article not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async approveUploadedArticle(adminId: string, id: string, message?: string) {
    try {
      const targetArticle = await this.prisma.article.findFirst({
        where: {
          id,
        },
      });

      if (targetArticle) {
        if (
          targetArticle.ArticleStatus !== 'DRAFT' &&
          targetArticle.ArticleStatus !== 'APPROVED'
        ) {
          await this.prisma.article.update({
            where: {
              id,
            },
            data: {
              ArticleStatus: 'APPROVED',
              SupervisedBy: {
                connect: {
                  id: adminId,
                },
              },
            },
          });
          await this.prisma.articleLog.create({
            data: {
              Article: {
                connect: {
                  id: targetArticle.id,
                },
              },
              message: message,
              ArticleLogStatus: 'APPROVED',
            },
          });
          return 'Article approved successfully';
        } else {
          throw new HttpException(
            'Approved article cannot update',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        throw new HttpException(
          'Article not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectUploadedArticle(adminId: string, id: string, message?: string) {
    try {
      const targetArticle = await this.prisma.article.findFirst({
        where: {
          id,
        },
      });

      if (targetArticle) {
        if (
          targetArticle.ArticleStatus !== 'DRAFT' &&
          targetArticle.ArticleStatus !== 'APPROVED'
        ) {
          await this.prisma.article.update({
            where: {
              id,
            },
            data: {
              ArticleStatus: 'REJECTED',
              SupervisedBy: {
                connect: {
                  id: adminId,
                },
              },
            },
          });
          await this.prisma.articleLog.create({
            data: {
              Article: {
                connect: {
                  id: targetArticle.id,
                },
              },
              message: message,
              ArticleLogStatus: 'REJECTED',
            },
          });
          return 'Article rejected successfully';
        } else {
          throw new HttpException(
            'Approved article cannot update',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        throw new HttpException(
          'Article not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async feedbackUploadedArticle(adminId: string, id: string, message?: string) {
    try {
      const targetArticle = await this.prisma.article.findFirst({
        where: {
          id,
        },
      });

      if (targetArticle) {
        if (
          targetArticle.ArticleStatus !== 'DRAFT' &&
          targetArticle.ArticleStatus !== 'APPROVED'
        ) {
          await this.prisma.article.update({
            where: {
              id,
            },
            data: {
              ArticleStatus: 'NEED_ACTION',
              SupervisedBy: {
                connect: {
                  id: adminId,
                },
              },
            },
          });
          await this.prisma.articleLog.create({
            data: {
              Article: {
                connect: {
                  id: targetArticle.id,
                },
              },
              message: message,
              ArticleLogStatus: 'NEED_ACTION',
            },
          });
          return 'Article is sent back to student successfully';
        } else {
          throw new HttpException(
            'Approved article cannot update',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        throw new HttpException(
          'Article not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
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
