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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { studentJWTAuthGuard } from 'src/auth/guards/jwt-student-auth.guard';
import { articleDraftDTO, articleFeedbackDTO, articleUploadDTO } from './dto';
import { Request } from 'express';
import { Account, ArticleStatus } from '@prisma/client';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @ApiOperation({ summary: 'article list admin provider' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('list-by-admin')
  @ApiQuery({
    name: 'page',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    required: true,
  })
  @ApiQuery({
    name: 'status',
    required: false,
  })
  @ApiQuery({
    name: 'faculty',
    required: false,
  })
  @ApiQuery({
    name: 'event',
    required: false,
  })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  async getAdminArticleList(
    @Req() req: Request,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: ArticleStatus | 'ALL',
    @Query('faculty') faculty?: string,
    @Query('event') event?: string,
    @Query('search') search?: string,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const articleList = await this.articleService.getArticleListByAdminId(
        admin.id,
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        faculty,
        event,
        search,
      );
      return {
        data: articleList,
        message: 'Article list fetched successfully',
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

  @ApiOperation({ summary: 'Student article list list provider' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Get('list-by-student-id')
  async getArticleByStudentId(
    @Req() req: Request,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status')
    status: ArticleStatus | 'ALL',
    @Query('search') search?: string,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const articleList = await this.articleService.getArticleListByStudentId(
        student.id,
        parseInt(page) || 1,
        parseInt(limit) || 10,
        status,
        search,
      );
      return {
        data: articleList,
        message: 'Student article list fetched successfully',
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

  @ApiOperation({ summary: 'Student article detail provider' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Get('detail-by-student-id/:id')
  async getArticleDetailByStudentId(@Param('id') id: string) {
    try {
      const articleDetail = await this.articleService.getArticleDetail(id);
      return {
        data: articleDetail,
        message: 'article detail fetched successfully',
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

  @ApiOperation({ summary: 'Student article detail provider' })
  @Get('detail-by-public/:id')
  async getArticleDetail(@Param('id') id: string) {
    try {
      const articleDetail = await this.articleService.getArticleDetail(id);
      return {
        data: articleDetail,
        message: 'article detail fetched successfully',
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

  @ApiOperation({ summary: 'Get public article list' })
  @Get('public-list')
  @ApiQuery({
    name: 'page',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    required: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  async getArticlePublic(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    try {
      const articleList = await this.articleService.getArticleList(
        parseInt(page) || 1,
        parseInt(limit) || 10,
        search,
      );
      return {
        data: articleList,
        message: 'Article list fetched successfully',
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

  @ApiOperation({ summary: 'Save draft article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Post('save-as-draft')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: articleDraftDTO,
    description: 'Student registration data',
  })
  @UseInterceptors(
    FileInterceptor('thumbnail', {
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
  async createDraftArticle(
    @Body() data: articleDraftDTO,
    @Req() req: Request,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const draftArticle = await this.articleService.saveDraftArticle(
        data,
        student,
        req,
        thumbnail,
      );
      return {
        data: draftArticle,
        message: 'Student article saved as draft successfully',
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

  @ApiOperation({ summary: 'Update draft article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Put('update-draft/:id')
  @ApiBody({
    type: articleDraftDTO,
    description: 'Student article data',
  })
  @UseInterceptors(
    FileInterceptor('thumbnail', {
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
  async updateDraftArticle(
    @Body() data: articleDraftDTO,
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const draftArticle = await this.articleService.updateDraftArticle(
        data,
        student,
        id,
        req,
        thumbnail,
      );
      return {
        data: draftArticle,
        message: 'Student article draft updated successfully',
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

  @ApiOperation({ summary: 'Upload article by student' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Post('upload-article')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: articleUploadDTO,
    description: 'Student article data',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'document', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
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
      },
    ),
  )
  async uploadStudentArticle(
    @Body() data: articleUploadDTO,
    @UploadedFiles()
    files: {
      document?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
    @Req() req: Request,
  ) {
    try {
      const student = req.user as Omit<Account, 'password'>;

      const document = files.document?.[0] as Express.Multer.File;
      const thumbnail = files.thumbnail?.[0] as Express.Multer.File;

      const draftArticle = await this.articleService.uploadArticle(
        data,
        student,
        req,
        document,
        thumbnail,
      );

      return {
        data: draftArticle,
        message: 'Student article saved as draft successfully',
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

  @ApiOperation({ summary: 'Delete draft article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Delete('delete-draft/:id')
  async deleteDraftArticle(@Param('id') id: string) {
    try {
      const draftArticle = await this.articleService.deleteDraftArticle(id);
      return {
        data: draftArticle,
        message: 'Draft article deleted successfully',
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

  @ApiOperation({ summary: 'Cancel article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Delete('cancel/:id')
  async cancelArticle(@Param('id') id: string) {
    try {
      const cancelledArticle =
        await this.articleService.cancelUploadedArticle(id);
      return {
        data: cancelledArticle,
        message: 'Article review cancelled successfully',
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

  @ApiOperation({ summary: 'Approve article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: articleFeedbackDTO,
  })
  @Put('approve/:id')
  async approveArticle(
    @Param('id') id: string,
    @Body() data: articleFeedbackDTO,
    @Req() req: Request,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const approvedArticle = await this.articleService.approveUploadedArticle(
        admin.id,
        id,
        data.message,
      );
      return {
        data: approvedArticle,
        message: 'Article approved successfully',
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

  @ApiOperation({ summary: 'Reject article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: articleFeedbackDTO,
  })
  @Put('reject/:id')
  async rejectArticle(
    @Param('id') id: string,
    @Body() data: articleFeedbackDTO,
    @Req() req: Request,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const approvedArticle = await this.articleService.rejectUploadedArticle(
        admin.id,
        id,
        data.message,
      );
      return {
        data: approvedArticle,
        message: 'Article rejected successfully',
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

  @ApiOperation({ summary: 'Feedback article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @ApiBody({
    type: articleFeedbackDTO,
  })
  @Put('feedback/:id')
  async feedbackArticle(
    @Param('id') id: string,
    @Body() data: articleFeedbackDTO,
    @Req() req: Request,
  ) {
    try {
      const admin = req.user as Omit<Account, 'password'>;
      const approvedArticle = await this.articleService.feedbackUploadedArticle(
        admin.id,
        id,
        data.message,
      );
      return {
        data: approvedArticle,
        message: 'Article sent back to student successfully',
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
}
