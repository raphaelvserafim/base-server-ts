import jwt from 'jsonwebtoken';
import { config } from '@app/config';
import { throwError } from '@app/utils';

export class SessionService {
  
  static generate(payload: {}, expiresIn = 7): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: `${expiresIn}d` });
  }

  static verify(token: string): { userId: number } {
    if (!token) throwError(401, "token not found");
    const { userId } = jwt.verify(token, config.jwt.secret) as { userId: number };
    if (!userId) throwError(401, "invalid token");
    return { userId };
  }
}