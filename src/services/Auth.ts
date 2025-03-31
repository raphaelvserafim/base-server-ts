import * as EmailValidator from 'email-validator';
import jwt from 'jsonwebtoken';
import { Login, Register, UpdatedPassword } from "@app/schema/Auth";
import { comparePasswords, generateRandomNumbers, returnError, throwError } from "@app/utils";
import { getEnv } from '@app/config/env';
import { NewPasswords } from '@app/database/NewPasswords';
import { User, Mail } from '@app/services';

const { JWT_KEY } = getEnv();

export class ServiceAuth extends User {
  constructor() {
    super();
  }

  generateSession(payload: {}) {
    try {
      return jwt.sign(payload, JWT_KEY, { expiresIn: '7d' });
    } catch (error) {
      throw error;
    }
  }

  async login(data: Login): Promise<{ status: number; session: string; message?: string; } | { status: number; message: string; session?: string; }> {
    try {
      const user = await this.userByEmail(data.email);
      if (!user) {
        throwError(404, "email not found");
      }

      const validPassword = await comparePasswords(data.password, user.dataValues.password);
      if (!validPassword) {
        throwError(401, "invalid password");
      }

      const session = this.generateSession({ user: user.dataValues.id });
      return { status: 200, session };
    } catch (error) {
      return returnError(error);
    }
  }

  async register(data: Register): Promise<{ status: number; session: string; message?: string; } | { status: number; message: string; session?: string; }> {
    try {
      if (!data.name) throwError(400, "enter name first");
      if (!data.email) throwError(400, "enter email first");
      if (!EmailValidator.validate(data.email)) throwError(400, "invalid email");
      if (!data.password) throwError(400, "enter password first");

      const response = await this.userByEmail(data.email);
      if (response?.dataValues?.id) throwError(400, "email already registered");

      const user = await this.userCreate(data);
      if (user.dataValues.id) {
        const session = this.generateSession({ user: user.dataValues.id });
        return { status: 201, session };
      } else {
        throwError(400, "error creating user");
      }
    } catch (error) {
      return returnError(error);
    }
  }

  async requestNewPassword(email: string): Promise<{ status: number; message: string; }> {
    try {
      const user = await this.userByEmail(email);
      if (!user) throwError(404, "email not found");

      const userId = Number(user.dataValues.id);
      const response = await NewPasswords.findOne({ where: { userId } });

      if (response) {
        const { expire, status } = response.dataValues;
        if (status) throwError(400, "code already sent");
      }

      const code = generateRandomNumbers(5);
      let expire = new Date();
      expire.setHours(expire.getHours() + 2);

      await NewPasswords.create({ userId, token: code, status: 1, expire });

      await Mail.sendCodeNewPassword(email, user.dataValues.name, String(code));

      return { status: 201, message: "Code to reset password sent to your email" };
    } catch (error) {
      return returnError(error);
    }
  }

  async updatePassword(data: UpdatedPassword): Promise<{ status: number; message: string; }> {
    try {
      const { code, password } = data;
      const response = await NewPasswords.findOne({ where: { token: code } });

      if (!response) throwError(404, "code not found");

      const { userId, status } = response.dataValues;
      if (!status) throwError(400, "code already used");
      if (!password) throwError(400, "enter password first");

      await this.userUpdatePassword(password, userId);

      await NewPasswords.update({ status: 2 }, { where: { token: code } });

      return { status: 200, message: "Updated successfully" };
    } catch (error) {
      return returnError(error);
    }
  }
}