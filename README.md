## Серверная часть платформы для квиз-игр
Клиентская часть: https://github.com/roman23323/quiz-client

Сервер реализован на TypeScript и фреймворке NestJS. Используется СУБД PostgreSQL, Redis, BullMQ, GigaChat API, Socket.io

Функциональность включает в себя регистрацию и авторизацию, создание и прохождение квизов, генерацию квизов с помощью GigaChat

Для запуска:

1. Клонируйте репозиторий:
   
   git clone https://github.com/roman23323/quiz-server.git

2. Установите зависимости:

   bun install

3. Получите GigaChat API ключ: https://developers.sber.ru/studio/workspaces/my-space/get/gigachat-api

4. Укажите переменные окружения в docker-compose.yml

5. Соберите образ:

   docker build -t quiz-server .

6. Укажите название образа в docker-compose.yml, если выбрали другое

7. Запустите сервисы:

   docker compose up

Требуется сертификат Минцифры для работы с GigaChat, он включён в репозитории и встраивается в скрипте start:prod
