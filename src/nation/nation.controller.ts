import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NationService } from './nation.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { nationCreateDTO } from './dto';
import { Request } from 'express';

@ApiTags('Nation')
@Controller('nation')
export class NationController {
  constructor(private readonly nationService: NationService) {}

  @ApiOperation({ summary: 'Faculty list provider' })
  @Get('list-public')
  async facultyListFetcher() {
    try {
      const facultyList = await this.nationService.getNationList();
      return {
        data: facultyList,
        message: 'Faculty list fetched successfully',
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

  @Post('create')
  @ApiOperation({ summary: 'create nation' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: nationCreateDTO })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createNation(
    @Body() data: nationCreateDTO,
    @Req() req: Request,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const createdNation = await this.nationService.createNation(
        data,
        image,
        req,
      );
      return {
        data: createdNation,
        message: 'Nation created successfully',
      };
    } catch (err) {
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
