import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req: any, res: any, next: any) => {
    const standardMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);
    if (!standardMethods.has(req.method)) {
      res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
      return res.status(405).json({ message: 'Method Not Allowed', statusCode: 405 });
    }
    if (req.method === 'TRACE' && req.path && req.path.startsWith('/auth')) {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ message: 'Method Not Allowed', statusCode: 405 });
    }
    if (req.path === '/quizzes' && req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ message: 'Method Not Allowed', statusCode: 405 });
    }
    if (req.path === '/sessions' && req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ message: 'Method Not Allowed', statusCode: 405 });
    }
    if (req.method === 'TRACE' && req.path && req.path.startsWith('/quizzes')) {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ message: 'Method Not Allowed', statusCode: 405 });
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Quiz API')
      .setDescription('API docs for the Quiz server')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    app.use('/api-json', (_req: any, res: any) => {
      try {
        const localSpec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));
        return res.json(localSpec);
      } catch (err) {
        return res.json(document);
      }
    });
    SwaggerModule.setup('api', app, document);
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
