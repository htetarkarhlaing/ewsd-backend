import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Account } from '@prisma/client';
import { StudentService } from '../student.service';

@Injectable()
export class studentLocalStrategy extends PassportStrategy(
  Strategy,
  'local-student',
) {
  constructor(private studentService: StudentService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<null | Omit<Account, 'password'>> {
    try {
      const admin = await this.studentService.validateStudent(email, password);
      if (!admin) {
        return null;
      }
      return admin;
    } catch (err) {
      throw new HttpException(
        JSON.stringify(err),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
