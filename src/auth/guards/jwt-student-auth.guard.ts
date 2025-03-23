import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class studentJWTAuthGuard extends AuthGuard('jwt-student') {}
