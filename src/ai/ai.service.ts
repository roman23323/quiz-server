import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import GigaChat from 'gigachat';

@Injectable()
export class AiService implements OnModuleInit {
    private gigachat: GigaChat;

    constructor(private readonly configService: ConfigService) {}

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

Формат:
{
  "settings": {
    "title": "Тест",
    "description": "",
    "visibility": "public",
    "secondsPerQuestion": 200
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

        content = content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        try {
            const parsed = JSON.parse(content);
            return parsed;
        } catch (e) {
            throw new Error(
                `Failed to parse GigaChat response as JSON: ${content}`,
            );
        }
    }
}