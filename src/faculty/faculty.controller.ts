import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
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
import { facultyCreateDTO, facultyUpdateDTO } from './dto';
import { Request } from 'express';

@ApiTags('Faculty')
@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @ApiOperation({ summary: 'Admin faculty list provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('list-admin')
  async adminFacultyListFetcher(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: 'ALL' | 'ACTIVE' | 'SUSPENDED',
    @Query('search')
    search?: string,
  ) {
    try {
      const facultyList = await this.facultyService.getFacultyList(
        'ADMIN',
        parseInt(page.toString()),
        parseInt(limit.toString()),
        status,
        search,
      );
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
  async facultyListPaginatedFetcher(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search')
    search?: string,
  ) {
    try {
      const facultyList = await this.facultyService.getFacultyList(
        'PUBLIC',
        parseInt(page.toString()),
        parseInt(limit.toString()),
        undefined,
        search,
      );
      return {
        data: facultyList,
        message: 'Faculty list fetched successfully',
      };
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

  @ApiOperation({ summary: 'Faculty list without pagination' })
  @Get('list-public-no-pagination')
  async facultyListFetcher() {
    try {
      const facultyList =
        await this.facultyService.getNonPaginatedFacultyList();
      return {
        data: facultyList,
        message: 'Faculty list fetched successfully',
      };
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
  async createFaculty(
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

  @Put('update/:id')
  @ApiOperation({ summary: 'update faculty' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: facultyUpdateDTO })
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
  async updateFaculty(
    @Param('id') id: string,
    @Body() data: facultyCreateDTO,
    @Req() req: Request,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const updatedFaculty = await this.facultyService.updateFaculty(
        id,
        data,
        req,
        image,
      );
      return {
        data: updatedFaculty,
        message: 'Faculty updated successfully',
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

  @Delete('toggle/:id')
  @ApiOperation({ summary: 'toggle faculty' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  async toggleFaculty(@Param('id') id: string) {
    try {
      const updatedFaculty = await this.facultyService.toggleFaculty(id);
      return {
        data: updatedFaculty,
        message: 'Faculty updated successfully',
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

  @Delete('delete/:id')
  @ApiOperation({ summary: 'delete faculty' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  async deleteFaculty(@Param('id') id: string) {
    try {
      const updatedFaculty = await this.facultyService.deleteFaculty(id);
      return {
        data: updatedFaculty,
        message: 'Faculty deleted successfully',
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
