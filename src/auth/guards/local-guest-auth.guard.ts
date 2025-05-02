import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GuestLocalAuthGuard extends AuthGuard('local-guest') {}
