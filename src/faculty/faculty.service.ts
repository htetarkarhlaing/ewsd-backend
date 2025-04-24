import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { facultyCreateDTO } from './dto';
import { Account } from '@prisma/client';

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) {}

  private async facultyCodeGenerator(name: string): Promise<string> {
    const words = name.trim().split(/\s+/);

    let code: string;
    if (words.length === 1) {
      code = words[0].charAt(0).toUpperCase() + 'N';
    } else {
      code = words.map((word) => word.charAt(0).toUpperCase()).join('');
    }

    const result = Math.floor(1000 + Math.random() * 9000).toString();
    const facultyCode = code + result;

    const existingLoginCode = await this.prisma.faculty.findFirst({
      where: { facultyCode },
    });

    if (existingLoginCode) {
      return this.facultyCodeGenerator(name);
    }

    return facultyCode;
  }

  async getFacultyList(
    namespace: 'ADMIN' | 'PUBLIC',
    page = 1,
    limit = 10,
    status?: 'ALL' | 'ACTIVE' | 'SUSPENDED',
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [facultyList, total] = await Promise.all([
        await this.prisma.faculty.findMany({
          where: {
            ...(namespace === 'ADMIN'
              ? {
                  Status: status !== 'ALL' ? status : 'ACTIVE',
                  ...(search && {
                    OR: [
                      {
                        name: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  }),
                }
              : {
                  Status: 'ACTIVE',
                }),
          },
          include: {
            CreatedBy: {
              include: {
                AccountRole: true,
                AccountInfo: {
                  include: {
                    Avatar: true,
                  },
                },
              },
            },
            Avatar: true,
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        await this.prisma.faculty.count({
          where: {
            ...(namespace === 'ADMIN'
              ? {
                  Status: status !== 'ALL' ? status : 'ACTIVE',
                  ...(search && {
                    OR: [
                      {
                        name: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  }),
                }
              : {
                  Status: 'ACTIVE',
                }),
          },
        }),
      ]);

      return {
        data: facultyList,
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

  async getNonPaginatedFacultyList() {
    try {
      const facultyList = await this.prisma.faculty.findMany({
        where: {
          Status: 'ACTIVE',
        },
        include: {
          CreatedBy: {
            include: {
              AccountRole: true,
              AccountInfo: {
                include: {
                  Avatar: true,
                },
              },
            },
          },
          Avatar: true,
        },
      });

      return facultyList;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createFaculty(
    data: facultyCreateDTO,
    image: Express.Multer.File,
    req: Request,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const createdFaculty = await this.prisma.faculty.create({
        data: {
          name: data.name,
          description: data.description,
          facultyCode: await this.facultyCodeGenerator(data.name),
          CreatedBy: {
            connect: {
              id: admin.id,
            },
          },
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
        },
        include: {
          CreatedBy: {
            include: {
              AccountRole: true,
              AccountInfo: {
                include: {
                  Avatar: true,
                },
              },
            },
          },
          Avatar: true,
        },
      });
      return createdFaculty;
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
