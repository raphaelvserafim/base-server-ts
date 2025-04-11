import jwt from 'jsonwebtoken';
import { config } from '@app/config';
import { throwError } from '@app/utils';
import { IAuthSession } from '@app/interfaces';

export class SessionService {

  static generate(payload: {}, expiresIn = 7): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: `${expiresIn}d` });
  }

  static verify(token: string): IAuthSession {
    if (!token) throwError(401, "token not found");
    const decode = jwt.verify(token, config.jwt.secret) as IAuthSession;
    if (!decode.userId) throwError(401, "invalid token");
    return decode;
  }
}