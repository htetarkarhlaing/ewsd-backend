import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Account } from '@prisma/client';
import { GuestService } from '../guest.service';

@Injectable()
export class guardLocalStrategy extends PassportStrategy(
  Strategy,
  'local-guest',
) {
  constructor(private guestService: GuestService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<null | Omit<Account, 'password'>> {
    try {
      const admin = await this.guestService.validateGuest(email, password);
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
