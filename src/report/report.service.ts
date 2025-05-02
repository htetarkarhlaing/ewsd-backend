import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async fetchDashboardReport() {
    try {
      const [totalStudent, totalAdmin, totalFaculty, totalEvent] =
        await Promise.all([
          await this.prisma.account.count({
            where: {
              AND: [
                {
                  AccountRoleType: 'STUDENT',
                },
                {
                  AccountStatus: 'ACTIVE',
                },
              ],
            },
          }),

          await this.prisma.account.count({
            where: {
              AND: [
                {
                  AccountRoleType: 'ADMIN',
                },
                {
                  AccountStatus: 'ACTIVE',
                },
              ],
            },
          }),

          await this.prisma.faculty.count({
            where: {
              Status: 'ACTIVE',
            },
          }),
          await this.prisma.event.count({
            where: {
              Status: 'ACTIVE',
            },
          }),
        ]);

      return {
        totalStudent,
        totalAdmin,
        totalFaculty,
        totalEvent,
      };
    } catch (err) {
      console.log(err);
      throw new HttpException(
        'Error fetching article list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
