import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class guestJWTAuthGuard extends AuthGuard('jwt-guest') {}
