import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly redis: Redis;

    constructor(private readonly configModule: ConfigService) {
        this.redis = new Redis({
            host: configModule.get<string>('REDIS_URL'),
            port: configModule.get<number>('REDIS_PORT')
        });
    }
}
