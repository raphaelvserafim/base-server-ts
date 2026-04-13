import jwt from 'jsonwebtoken';
import { config } from '@app/config/index.js';
import { throwError } from '@app/utils/index.js';
import { UsersEntity } from '@app/database/index.js';
import { IAuthSession } from '@app/types/index.js';


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

  static async session(userId: number) {
    const user = await UsersEntity.findByPk(userId);
    if (!user) {
      throwError(404, "user not found");
    }
    const payload = {
      userId,
      emailVerified: user.dataValues.emailVerified,
      email: user.dataValues.email,
      permission: user.dataValues.permission,
      language: user.dataValues.language,
      timezone: user.dataValues.timezone,
      mock: "cHJvY3VyYW5kbyBvcXVlID8gbWUgbWFuZGEgemFwIDE0Mzc1MjIzNDE3IGZhbGEgMjExcGg="
    };
    const session = this.generate(payload);
    return session;
  }
}