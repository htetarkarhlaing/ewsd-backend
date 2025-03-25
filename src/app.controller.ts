import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipInterceptor } from './helper';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('files/:fileName')
  @SkipInterceptor()
  seeUploadedFile(@Param('fileName') name: string, @Res() res: Response) {
    return res.sendFile(name, { root: `${__dirname}/../uploads/` });
  }
}
