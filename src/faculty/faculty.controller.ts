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
import { FacultyService } from './faculty.service';
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
import { facultyCreateDTO } from './dto';
import { Request } from 'express';

@ApiTags('Faculty')
@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @ApiOperation({ summary: 'Admin faculty list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('list-admin')
  async adminFacultyListFetcher() {
    try {
      const facultyList = await this.facultyService.getFacultyList('ADMIN');
      return {
        data: facultyList,
        message: 'Admin faculty list fetched successfully',
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

  @ApiOperation({ summary: 'Faculty list provider' })
  @Get('list-public')
  async facultyListFetcher() {
    try {
      const facultyList = await this.facultyService.getFacultyList('PUBLIC');
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
  @ApiOperation({ summary: 'create faculty' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: facultyCreateDTO })
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
  async createSocialLink(
    @Body() data: facultyCreateDTO,
    @Req() req: Request,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const createdFaculty = await this.facultyService.createFaculty(
        data,
        image,
        req,
      );
      return {
        data: createdFaculty,
        message: 'Faculty created successfully',
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
