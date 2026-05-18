import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import GigaChat from 'gigachat';
import { QuizzesService } from 'src/quizzes/quizzes.service';

@Injectable()
export class AiService implements OnModuleInit {
    private gigachat: GigaChat;

    constructor(
        private readonly configService: ConfigService,
        private readonly quizzesService: QuizzesService
    ) { }

    onModuleInit() {
        this.gigachat = new GigaChat({
            credentials: this.configService.getOrThrow('GIGACHAT_AUTH_KEY'),
            scope: this.configService.getOrThrow('GIGACHAT_SCOPE'),
            model: this.configService.getOrThrow('GIGACHAT_MODEL'),
        });
    }

    async generateQuiz(topic: string) {
        const prompt = `
Сгенерируй вопросы для викторины в формате JSON.

Описание: ${topic}

Требования:
- Возвращай ТОЛЬКО валидный JSON
- Без markdown, без пояснений
- 4 варианта ответа на каждый вопрос
- Один правильный ответ
- "questionType" ТОЛЬКО "single_choice",

Формат:
{
  "settings": {
    "title": "Тест",
    "description": "",
    "visibility": "public",
    "secondsPerQuestion": 10
  },
  "questions": [
    {
      "text": "Вопрос",
      "questionType": "single_choice",
      "points": 2,
      "orderIndex": 0,
      "options": [
        { "text": "A", "isCorrect": false, "orderIndex": 0 },
        { "text": "B", "isCorrect": true, "orderIndex": 1 },
        { "text": "C", "isCorrect": false, "orderIndex": 2 },
        { "text": "D", "isCorrect": false, "orderIndex": 3 }
      ]
    }
  ]
}
        `;
        const response = await this.gigachat.chat({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        let content = response.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from GigaChat');
        }

        const cleaned = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        return this.retry(
            async () => {
                return JSON.parse(cleaned);
            },
            3,
            200,
            'parse-gigachat-json',
        );
    }

    async generateAndSaveQuiz(topic: string, userId: string) {
        const aiResult = await this.generateQuiz(topic);

        const { settings, questions } = aiResult;

        const quiz = await this.quizzesService.create(userId, {
            title: settings.title,
            description: settings.description,
            visibility: settings.visibility,
            secondsPerQuestion: settings.secondsPerQuestion,
        });

        for (const q of questions) {
            await this.retry(
                async () => {
                    return this.quizzesService.addQuestion(
                        quiz.id,
                        userId,
                        {
                            text: q.text,
                            questionType: q.questionType,
                            points: q.points,
                            orderIndex: q.orderIndex,
                            options: q.options,
                        },
                    );
                },
                3,
                200,
                `add-question-${q.orderIndex}`,
            );
        }

        return quiz;
    }

    private async retry<T>(
        fn: () => Promise<T>,
        retries = 3,
        delayMs = 300,
        label = 'operation',
    ): Promise<T> {
        let lastError: any;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await fn();
            } catch (e) {
                lastError = e;

                console.warn(
                    `[AI retry] ${label} failed (attempt ${attempt}/${retries})`,
                );

                if (attempt < retries) {
                    await new Promise((res) => setTimeout(res, delayMs));
                }
            }
        }

        throw lastError;
    }
}