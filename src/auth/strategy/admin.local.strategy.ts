import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Account } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(
  Strategy,
  'local-admin',
) {
  constructor(private adminService: AdminService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<null | Omit<Account, 'password'>> {
    try {
      const admin = await this.adminService.validateAdmin(email, password);
      if (!admin) {
        return null;
      }
      return admin;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        JSON.stringify(err),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
