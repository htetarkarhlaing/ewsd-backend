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
}
