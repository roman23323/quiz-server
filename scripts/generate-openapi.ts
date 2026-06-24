import 'reflect-metadata';
import { writeFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { QuizzesModule } from '../src/quizzes/quizzes.module';
import { SessionsModule } from '../src/sessions/sessions.module';
import { AiModule } from '../src/ai/ai.module';

async function generate() {
  console.log('generate-openapi: start');
  process.env.GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY ?? 'dummy_key';
  process.env.GIGACHAT_SCOPE = process.env.GIGACHAT_SCOPE ?? 'default';
  process.env.GIGACHAT_MODEL = process.env.GIGACHAT_MODEL ?? 'gpt-4o-mini';
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://user:pass@localhost:5432/db?schema=public';
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'changeme';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    console.log('generate-openapi: app created');

    console.log('generate-openapi: calling app.init()');
    await app.init();
    console.log('generate-openapi: app.init() done');

    try {
      // @ts-ignore - internal API
      const modules = app.container.getModules();
      console.log('generate-openapi: modules count', modules.size);
      for (const [key, mod] of modules.entries()) {
        const name = mod?.metatype?.name || key;
        const hasRoutes = !!mod?.routes;
        console.log(`module: ${name} - hasRoutes: ${hasRoutes}`);
      }
    } catch (e) {
      console.warn('generate-openapi: unable to inspect modules container', e);
    }

    const config = new DocumentBuilder()
      .setTitle('Quiz API')
      .setDescription('API docs for the Quiz server')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      include: [AuthModule, UsersModule, QuizzesModule, SessionsModule, AiModule],
    });
    console.log('generate-openapi: document created');
    const outPath = process.env.OPENAPI_OUT ?? 'openapi.json';
    writeFileSync(outPath, JSON.stringify(document, null, 2));
    console.log('generate-openapi: wrote OpenAPI document to', outPath);
    await app.close();
    console.log('generate-openapi: done');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('generate-openapi: error', err);
    process.exit(1);
  }
}

generate();
