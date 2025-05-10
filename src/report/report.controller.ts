import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { SkipInterceptor } from 'src/helper';
import { promises as fsPromises } from 'fs';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @ApiOperation({ summary: 'Dashboard report' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('dashboard')
  async getDashboardReport() {
    try {
      const dashboardData = await this.reportService.fetchDashboardReport();
      return {
        data: dashboardData,
        message: 'Dashboard info fetched successfully',
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

  @ApiOperation({ summary: 'Faculty population report' })
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @Get('faculty-population')
  async facultyPopulationReport() {
    try {
      const facultyPopulationData =
        await this.reportService.fetchFacultyPopulation();
      return {
        data: facultyPopulationData,
        message: 'Faculty population data successfully',
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

  @ApiOperation({ summary: 'Faculty article status report' })
  @Get('faculty-article-status')
  @ApiQuery({
    name: 'eventId',
    description: 'Event ID for specific event article status data',
  })
  async facultyArticleStatusReport(@Query() data: { eventId: string }) {
    try {
      const facultyPublicationData =
        await this.reportService.fetchFacultyArticleStatus(data.eventId);
      return {
        data: facultyPublicationData,
        message: 'Faculty publication data successfully',
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

  @ApiOperation({ summary: 'Faculty publication report' })
  @Get('faculty-contribution-status')
  @ApiQuery({
    name: 'eventId',
    description: 'Event ID for specific event publication data',
  })
  async facultyPublicationReport(@Query() data: { eventId: string }) {
    try {
      const facultyPublicationData =
        await this.reportService.fetchFacultyPublication(data.eventId);
      return {
        data: facultyPublicationData,
        message: 'Faculty publication data successfully',
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

  @ApiOperation({ summary: 'Download event article list zip' })
  @Get('download-zipped-event-article')
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'eventId',
    required: true,
  })
  async eventBasedArticleZipDownload(
    @Res() res: Response,
    @Query()
    query: {
      eventId: string;
    },
  ) {
    try {
      const fileNames: string[] = await this.reportService.articleWithEventId(
        query.eventId,
      );

      if (!fileNames || fileNames.length === 0) {
        throw new HttpException(
          'There is no article available',
          HttpStatus.BAD_REQUEST,
        );
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${query.eventId}.zip`,
      );

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.on('error', (err) => {
        throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      });

      archive.pipe(res);

      const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'articles');

      for (const fileName of fileNames) {
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: fileName });
        }
      }

      await archive.finalize();
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

  @Get('download-zipped-article/:id')
  @UseGuards(AdminJWTAuthGuard)
  @ApiBearerAuth()
  @SkipInterceptor()
  @ApiOperation({ summary: 'Download article zip' })
  async articleZipDownload(@Res() res: Response, @Param('id') id: string) {
    const fileNames: string[] = await this.reportService.findArticleById(id);

    if (!fileNames || fileNames.length === 0) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'There is no article available' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error creating archive' });
      } else {
        res.end();
      }
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${id}.zip`);

    archive.pipe(res);

    const uploadDir = path.join(__dirname, '..', 'uploads');

    // Async loop using Promise.all
    await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = path.join(uploadDir, fileName);
        try {
          await fsPromises.access(filePath);
          archive.file(filePath, {
            name: fileName,
          });
        } catch (err) {
          console.log(err);
          console.warn(`Skipping missing file: ${filePath}`);
        }
      }),
    );

    archive.finalize().catch((err) => {
      console.error('Error finalizing archive:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to finalize archive' });
      } else {
        res.end();
      }
    });
  }
}
