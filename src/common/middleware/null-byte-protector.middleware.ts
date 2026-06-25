import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class NullByteProtectorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
      const hasNullByte = (obj: any): boolean => {
        if (typeof obj === 'string') {
          return obj.includes('\u0000');
        }
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).some(hasNullByte);
        }
        return false;
      };

      if (hasNullByte(req.body)) {
        throw new BadRequestException('Strings must not contain null bytes (0x00)');
      }
    }
    next();
  }
}
