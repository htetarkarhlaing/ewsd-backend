import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MailService } from 'src/helper/Mailer';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AccountController],
  providers: [AccountService, MailService, ConfigService],
})
export class AccountModule {}
