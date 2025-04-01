import * as EmailValidator from 'email-validator';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

import { GoogleCredential, Login, Register, UpdatedPassword } from "@app/schema";
import { comparePasswords, encryptPassword, generateRandomNumbers, generateRandomToken, returnError, throwError } from "@app/utils";
import { getEnv } from '@app/config/env';
import { NewPasswords } from '@app/database/NewPasswords';
import { User, Mail } from '@app/services';
import { PROVIDERS } from '@app/types';
import { UserProviders, Users } from '@app/database';

const { JWT_KEY, GOOLE_CLIENT_ID } = getEnv();

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

      const session = this.generateSession({ userId: user.dataValues.id, });
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
        const session = this.generateSession({ userId: user.dataValues.id, });
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



  async google(data: GoogleCredential) {
    try {
      const { clientId, credential } = data;
      const GoogleClient = new OAuth2Client(GOOLE_CLIENT_ID);

      const ticket = await GoogleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) throwError(409, "Invalid Google credentials");

      const { email, name, picture = "", sub, locale = "" } = payload;
      const providerData: { clientId: string; provider: PROVIDERS } = { clientId: sub, provider: PROVIDERS.GOOGLE };

      const existingProvider = await UserProviders.findOne({ where: providerData });

      let session;

      if (!existingProvider?.dataValues.userId) {
        if (!email) throwError(400, "email not found");
        const user = await this.userByEmail(email);

        if (!user?.dataValues.id) {
          if (!name) throwError(400, "name not found");
          const newUser = await this.userCreate({ name, email, password: generateRandomToken(10) });
          if (!newUser.dataValues.id) throwError(409, "Error creating user");
          await this.linkUserProvider(newUser.dataValues.id, providerData, picture, locale);

          session = this.generateSession({ userId: newUser.dataValues.id });
        } else {
          await this.linkUserProvider(user.dataValues.id, providerData, picture, locale);
          if (!user.dataValues.emailVerified) await this.verifyUserEmail(user.dataValues.id, picture);

          session = this.generateSession({ userId: user.dataValues.id });
        }
      } else {
        const user = await Users.findByPk(existingProvider?.dataValues.userId);
        if (!user?.dataValues.id) throwError(409, "User not found");

        if (!user.dataValues.emailVerified) await this.verifyUserEmail(user.dataValues.id, picture);

        session = this.generateSession({ userId: user.dataValues.id });
      }

      return { status: 200, session, message: "Successfully authenticated" };
    } catch (error) {
      return returnError(error);
    }
  }

  private async linkUserProvider(userId: number, providerData: { clientId: string; provider: PROVIDERS }, picture: string, locale: string) {
    await UserProviders.create({ userId, clientId: providerData.clientId, provider: providerData.provider, picture, locale });
  }


  private async verifyUserEmail(userId: number, picture: string) {
    await Users.update({ emailVerified: true, picture }, { where: { id: userId } });
  }




  async confirmEmail(email: string) {
    try {
      const user = await this.userByEmail(email);

      if (!user) {
        throwError(404, "email not found")
      }

      if (user.dataValues.emailVerified) {
        throwError(409, "email already confirmed")
      }

      const userId = Number(user.dataValues.id);

      const code = jwt.sign({ userId }, JWT_KEY, { expiresIn: '30d' });

      // const sending = await Mail.sendConfirmEmail(email, user?.dataValues?.name, String(code));

      return { status: 201, message: "Code to confirm email sent to your email" };
    } catch (error) {
      return returnError(error);
    }

  }


  async updateConfirmEmail(token: string) {
    try {
      const { userId } = jwt.verify(token, JWT_KEY) as { userId: number };

      if (!userId) {
        throwError(404, "code not found")
      }

      const user = await Users.findByPk(userId);

      if (!user) {
        throwError(404, "user not found")
      }

      if (user.dataValues.emailVerified) {
        throwError(409, "email already confirmed");
      }

      await Users.update({ emailVerified: true }, { where: { id: userId } });

      const session = this.generateSession({ userId: user.dataValues.id });

      return { status: 200, session, message: "Email confirmed" };
    } catch (error) {
      return returnError(error);
    }
  }
}