import { Service } from '@tsed/di';
import * as EmailValidator from 'email-validator';

import { returnError, throwError } from "@app/utils";

import { AuthUtils, GoogleStrategy, PasswordRecoveryService, SessionService } from '@app/services';

import { LoginSchema, RegisterSchema, UpdatedPasswordSchema, GoogleCredentialSchema } from '@app/schemas';

import { IAuthService, } from '@app/interfaces';
import { Users } from '@app/database';

@Service()
export class AuthService implements IAuthService {

  async login(data: LoginSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {
      const user = await Users.findOne({ where: { email: data.email } });
      if (!user) {
        throwError(404, "email not found");
      }
      const userId = Number(user.dataValues.id);
      const password = user.dataValues.password;

      const validPassword = await AuthUtils.comparePassword(data.password, password);

      if (!validPassword) {
        throwError(401, "invalid password");
      }

      const session = SessionService.generate({ userId });

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

      const hashedPassword = await AuthUtils.encryptPassword(data.password);
      if (!hashedPassword) {
        throwError(400, "error hashing password");
      }

      const newUser = await Users.create({
        ...data,
        password: hashedPassword,
        emailVerified: false
      })

      const userId = Number(newUser.dataValues.id);

      if (!userId) {
        throwError(400, "error creating user");
      }

      const session = SessionService.generate({ userId });


      return { status: 201, message: "success", session: session };
    } catch (error) {
      return returnError(error);
    }
  }


  async requestNewPassword(email: string): Promise<{ status: number; message: string; }> {
    try {
      return await PasswordRecoveryService.request(email);
    } catch (error) {
      return returnError(error);
    }
  }


  async updatePassword(data: UpdatedPasswordSchema): Promise<{ status: number; message: string; }> {
    try {
      const { code, password } = data;
      return await PasswordRecoveryService.update(code, password);
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

      const code = SessionService.generate({ userId }, 1);

      return { status: 201, message: "Code to confirm email sent to your email" };
    } catch (error) {
      return returnError(error);
    }

  }

  async updateConfirmEmail(token: string): Promise<{ status: number; message: string; session?: string; }> {
    try {
      const { userId } = SessionService.verify(token);

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

      const session = SessionService.generate({ userId: user.dataValues.id });

      return { status: 200, session, message: "Email confirmed" };
    } catch (error) {
      return returnError(error);
    }
  }



  async google(data: GoogleCredentialSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {
      const { clientId, credential } = data;
      return await GoogleStrategy.authenticate({ clientId, credential });
    } catch (error) {
      return returnError(error);
    }
  }


}