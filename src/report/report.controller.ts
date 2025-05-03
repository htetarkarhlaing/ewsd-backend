import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminJWTAuthGuard } from 'src/auth/guards/jwt-admin-auth.guard';

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

  @ApiOperation({ summary: 'Faculty publication report' })
  @Get('faculty-publication')
  async facultyPublicationReport() {
    try {
      const facultyPublicationData =
        await this.reportService.fetchFacultyPublication();
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
}
