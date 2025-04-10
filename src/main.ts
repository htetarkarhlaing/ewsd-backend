declare const module: any;

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { ResponseInterceptor } from './helper';
import { AllExceptionsFilter } from './helper/All-exception.filterer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'Apex',
      colors: true,
      compact: true,
      timestamp: true,
    }),
  });
  app.enableCors({
    origin: '*',
    methods: '*',
  });
  app.enableShutdownHooks();
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector())); // * success response formatter
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Apex University')
    .setDescription('Apex University API description')
    .setVersion('0.0.1')
    .addTag('Public')
    .addBearerAuth()
    .addServer(`http://localhost:${process.env.PORT ?? 3000}`, 'Local')
    .addServer(`https://ewsd.visionx.com.mm`, 'Production')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const theme = new SwaggerTheme();

  SwaggerModule.setup('docs', app, documentFactory, {
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DRACULA),
  });

  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
