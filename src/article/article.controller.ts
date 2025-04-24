import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { studentJWTAuthGuard } from 'src/auth/guards/jwt-student-auth.guard';
import { articleDraftDTO } from './dto';
import { Request } from 'express';
import { Account, ArticleStatus } from '@prisma/client';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

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

  @ApiOperation({ summary: 'Save draft article' })
  @UseGuards(studentJWTAuthGuard)
  @ApiBearerAuth()
  @Post('save-as-draft')
  @ApiBody({
    type: articleDraftDTO,
    description: 'Student registration data',
  })
  async createDraftArticle(@Body() data: articleDraftDTO, @Req() req: Request) {
    try {
      const student = req.user as Omit<Account, 'password'>;
      const draftArticle = await this.articleService.saveDraftArticle(
        data,
        student,
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
}
