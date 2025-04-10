import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { nationCreateDTO } from './dto';
import { Account } from '@prisma/client';

@Injectable()
export class NationService {
  constructor(private prisma: PrismaService) {}

  async getNationList() {
    try {
      const nationList = await this.prisma.nationality.findMany({
        where: {
          Status: 'ACTIVE',
        },
        include: {
          Avatar: true,
        },
      });

      return nationList;
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

  async createNation(
    data: nationCreateDTO,
    image: Express.Multer.File,
    req: Request,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const createdNation = await this.prisma.nationality.create({
        data: {
          name: data.name,
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
          CreatedBy: {
            connect: {
              id: admin.id,
            },
          },
        },
        include: {
          Avatar: true,
        },
      });
      return createdNation;
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
