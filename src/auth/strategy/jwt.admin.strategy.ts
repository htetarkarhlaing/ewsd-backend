import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../dto/jwt-payload.interface';
import { Account } from '@prisma/client';
import { AdminService } from '../admin.service';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(private readonly adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_TOKEN_ADMIN as string,
    });
  }

  async validate(payload: JwtPayload): Promise<Omit<Account, 'password'>> {
    try {
      const admin = await this.adminService.validateAdminById(payload.id);
      if (!admin) {
        throw new HttpException(
          'Credential not match',
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        return admin;
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
