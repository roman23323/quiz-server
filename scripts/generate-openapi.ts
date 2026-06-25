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
    for (const pathKey of Object.keys(document.paths || {})) {
      const pathItem: any = (document.paths as any)[pathKey];
      for (const methodKey of Object.keys(pathItem)) {
        const op = pathItem[methodKey];
        if (!op.responses) op.responses = {};
        if (!op.responses['405']) {
          op.responses['405'] = { description: 'Method Not Allowed' };
        }
        if (methodKey.toLowerCase() === 'get' && Array.isArray(op.parameters) && op.parameters.some((p: any) => p.in === 'path')) {
          if (!op.responses['404']) {
            op.responses['404'] = { description: 'Not Found' };
          }
        }
      }
    }
    if (document.paths && document.paths['/quizzes'] && document.paths['/quizzes'].post) {
      const postQuizResponse = document.paths['/quizzes'].post.responses?.['201'] as any;
      
      if (postQuizResponse) {
        postQuizResponse.links = {
          GetQuizForEditLink: {
            operationId: 'QuizzesController_getQuizForEdit',
            parameters: { id: '$response.body#/id' }
          },
          GetQuizForPlayLink: {
            operationId: 'QuizzesController_getQuizForPlay',
            parameters: { id: '$response.body#/id' }
          },
          UpdateQuizLink: {
            operationId: 'QuizzesController_updateQuiz',
            parameters: { id: '$response.body#/id' }
          },
          DeleteQuizLink: {
            operationId: 'QuizzesController_deleteQuiz',
            parameters: { id: '$response.body#/id' }
          },
          CreateQuestionLink: {
            operationId: 'QuizzesController_createQuestion',
            parameters: { id: '$response.body#/id' }
          }
        };
        console.log('generate-openapi: successfully linked POST /quizzes to basic sub-routes');
      }
    }

    if (document.paths && document.paths['/quizzes/{id}/questions'] && document.paths['/quizzes/{id}/questions'].post) {
      const postQuestionResponse = document.paths['/quizzes/{id}/questions'].post.responses?.['201'] as any;
      
      if (postQuestionResponse) {
        postQuestionResponse.links = {
          CreateSessionLink: {
            operationId: 'SessionsController_createSession',
            requestBody: {
              quizId: '$request.path.id'
            }
          },
          UpdateQuestionLink: {
            operationId: 'QuizzesController_updateQuestion',
            parameters: {
              id: '$request.path.id',
              questionId: '$response.body#/id'
            }
          }
        };
        console.log('generate-openapi: successfully linked Question creation with Session creation');
      }
    }

    if (document.paths && document.paths['/sessions'] && document.paths['/sessions'].post) {
      const sessionResponses = document.paths['/sessions'].post.responses || {};
      const successStatuses = ['201', '200'];
      
      for (const status of successStatuses) {
        const postSessionResponse = sessionResponses[status] as any;
        
        if (postSessionResponse) {
          postSessionResponse.links = {
            GetCurrentQuestionLink: {
              operationId: 'SessionsController_getCurrentQuestion',
              parameters: { id: '$response.body#/id' }
            },
            SubmitAnswerLink: {
              operationId: 'SessionsController_submitAnswer',
              parameters: { id: '$response.body#/id' }
            },
            GetResultLink: {
              operationId: 'SessionsController_getResult',
              parameters: { id: '$response.body#/id' }
            },
            GetLeaderboardLink: {
              operationId: 'SessionsController_getLeaderboard',
              parameters: { id: '$response.body#/id' }
            }
          };
        }
      }
      console.log('generate-openapi: successfully linked POST /sessions with all dependent sub-routes (200/201)');
    }
    console.log('generate-openapi: document created');

    if (document.components && document.components.schemas) {
      const schemas = document.components.schemas;
      
      for (const schemaName of Object.keys(schemas)) {
        const schema: any = schemas[schemaName];
        
        if (schema && typeof schema === 'object' && (!schema.type || schema.type === 'object')) {
          schema.additionalProperties = false;
        }
      }
      console.log('generate-openapi: marked all object schemas with additionalProperties = false');
    }
    if (document.components && document.components.schemas && document.components.schemas.CreateQuestionDto) {
      const baseSchema: any = document.components.schemas.CreateQuestionDto;
      
      const sharedProperties = { ...baseSchema.properties };
      delete sharedProperties.correctAnswer;
      delete sharedProperties.options;

      document.components.schemas.CreateQuestionDto = {
        type: 'object',
        required: baseSchema.required?.filter((r: string) => r !== 'correctAnswer' && r !== 'options') || [],
        properties: sharedProperties,
        additionalProperties: false,
        oneOf: [
          {
            description: 'Вариант для одиночного выбора (single_choice)',
            properties: {
              questionType: { enum: ['single_choice'] },
              correctAnswer: { type: 'string' }
            },
            required: ['questionType', 'correctAnswer']
          },
          {
            description: 'Вариант для текстового ответа (text)',
            properties: {
              questionType: { enum: ['text'] },
              options: { 
                type: 'array', 
                items: { $ref: '#/components/schemas/CreateQuestionOptionDto' }
              }
            },
            required: ['questionType', 'options']
          }
        ]
      } as any;
      console.log('generate-openapi: successfully applied oneOf validation to CreateQuestionDto');
    }
    if (document.components && document.components.schemas) {
      const schemas = document.components.schemas;
      
      for (const schemaName of Object.keys(schemas)) {
        const schema: any = schemas[schemaName];
        
        if (schema && typeof schema === 'object' && (!schema.type || schema.type === 'object')) {
          schema.additionalProperties = false;
        }

        if (schema && schema.properties) {
          for (const propKey of Object.keys(schema.properties)) {
            const property = schema.properties[propKey];
            
            if (property && property.type === 'string' && !property.pattern && !property.format) {
              property.pattern = '^[^\x00]*$';
              property.description = (property.description || '') + ' (Must not contain null bytes)';
            }
          }
        }
      }
      console.log('generate-openapi: marked all object schemas with additionalProperties = false and blocked null bytes in strings');
    }


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
