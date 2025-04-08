import { Service } from '@tsed/di';
import * as EmailValidator from 'email-validator';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';

import { generateRandomNumbers, generateRandomToken, returnError, throwError } from "@app/utils";
import { NewPasswords } from '@app/database/NewPasswords';
import { Mail } from '@app/services';
import { IAuthService, PROVIDERS } from '@app/interfaces';
import { UserProviders, Users } from '@app/database';
import { LoginSchema, RegisterSchema, UpdatedPasswordSchema, GoogleCredentialSchema } from '@app/schemas';
import { config } from '@app/config';



@Service()
export class AuthService implements IAuthService {

  generateSession(payload: {}, expiresIn: number = 7): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: `${expiresIn}d` });
  }


  verifySession(token: string): { userId: number } {
    if (!token) {
      throwError(401, "token not found");
    }

    const { userId } = jwt.verify(token, config.jwt.secret) as { userId: number };

    if (!userId) {
      throwError(401, "invalid token");
    }

    return { userId };

  }


  async encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, await bcrypt.genSalt(10));
  }


  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }


  async login(data: LoginSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {
      const user = await Users.findOne({ where: { email: data.email } });
      if (!user) {
        throwError(404, "email not found");
      }

      const validPassword = await this.comparePassword(data.password, user.dataValues.password);

      if (!validPassword) {
        throwError(401, "invalid password");
      }

      const session = this.generateSession({ userId: user.dataValues.id, });

      return { status: 200, message: "success", session };
    } catch (error) {
      return returnError(error);
    }
  }

  async register(data: RegisterSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {
      if (!data.name) throwError(400, "enter name first");
      if (!data.email) throwError(400, "enter email first");
      if (!EmailValidator.validate(data.email)) throwError(400, "invalid email");
      if (!data.password) throwError(400, "enter password first");


      const user = await Users.findOne({ where: { email: data.email } });

      if (user) {
        throwError(400, "email already registered");
      }

      const hashedPassword = await this.encryptPassword(data.password);
      if (!hashedPassword) {
        throwError(400, "error hashing password");
      }

      const newUser = await Users.create({
        ...data,
        password: hashedPassword,
        emailVerified: false
      });

      if (!newUser.dataValues.id) {
        throwError(400, "error creating user");
      }

      const session = this.generateSession({ userId: newUser.dataValues.id, });


      return { status: 201, message: "success", session: session };
    } catch (error) {
      return returnError(error);
    }
  }

  async requestNewPassword(email: string): Promise<{ status: number; message: string; }> {
    try {
      const user = await Users.findOne({ where: { email } });

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


  async updatePassword(data: UpdatedPasswordSchema): Promise<{ status: number; message: string; }> {
    try {
      const { code, password } = data;

      const response = await NewPasswords.findOne({ where: { token: code } });

      if (!response) throwError(404, "code not found");

      const { userId, status } = response.dataValues;

      if (!status) throwError(400, "code already used");
      if (!password) throwError(400, "enter password first");

      const hashedPassword = await this.encryptPassword(data.password);

      await Users.update({ password: hashedPassword }, { where: { id: userId } });

      await NewPasswords.update({ status: 2 }, { where: { token: code } });

      return { status: 200, message: "Updated successfully" };
    } catch (error) {
      return returnError(error);
    }
  }



  async confirmEmail(email: string): Promise<{ status: number; message: string; }> {
    try {
      const user = await Users.findOne({ where: { email } });

      if (!user) {
        throwError(404, "email not found")
      }

      if (user.dataValues.emailVerified) {
        throwError(409, "email already confirmed")
      }

      const userId = Number(user.dataValues.id);

      const code = this.generateSession({ userId }, 1);

      return { status: 201, message: "Code to confirm email sent to your email" };
    } catch (error) {
      return returnError(error);
    }

  }

  async updateConfirmEmail(token: string): Promise<{ status: number; message: string; session?: string; }> {
    try {
      const { userId } = this.verifySession(token);

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


  private async linkUserProvider(userId: number, providerData: { clientId: string; provider: PROVIDERS }, picture: string, locale: string) {
    await UserProviders.create({ userId, clientId: providerData.clientId, provider: providerData.provider, picture, locale });
  }


  private async verifyUserEmail(userId: number, picture: string) {
    await Users.update({ emailVerified: true, picture }, { where: { id: userId } });
  }



  async google(data: GoogleCredentialSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {
      const { clientId, credential } = data;

      const GoogleClient = new OAuth2Client(config.google.clientId);

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

        const user = await Users.findOne({ where: { email } });

        if (!user?.dataValues.id) {
          if (!name) throwError(400, "name not found");

          const newUser = await Users.create({
            name,
            email,
            password: generateRandomToken(10),
            emailVerified: true,
            picture,
          });

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

}