import { Service } from '@tsed/di';

import { returnError, throwError } from "@app/utils";

import { AuthUtils, GoogleStrategy, PasswordRecoveryService, SessionService } from '@app/services';

import { LoginSchema, RegisterSchema, UpdatedPasswordSchema, GoogleCredentialSchema } from '@app/schemas';

import { IAuthService, } from '@app/interfaces';
import { UserCredentials, Users } from '@app/database';
import { AuthValidator } from '@app/validators';

@Service()
export class AuthService implements IAuthService {

  async login(data: LoginSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {

      AuthValidator.validateLogin(data);
     
      const user = await UserCredentials.findOne({ where: { email: data.email } });

      if (!user) {
        throwError(404, "email not found");
      }

      const userId = Number(user.dataValues.userId);
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
      AuthValidator.validateRegister(data);

      const user = await UserCredentials.findOne({ where: { email: data.email } });

      if (user) {
        throwError(400, "email already registered");
      }


      const userData = {
        name: data.name,
      };

      const newUser = await Users.create(userData);

      const userId = Number(newUser.dataValues.id);

      if (!userId) {
        throwError(400, "error creating user");
      }

      const hashedPassword = await AuthUtils.encryptPassword(data.password);
      if (!hashedPassword) {
        throwError(400, "error hashing password");
      }

      await UserCredentials.create({
        userId,
        email: data.email,
        password: hashedPassword,
        emailVerified: false
      });

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
      const user = await UserCredentials.findOne({ where: { email } });


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

      const user = await UserCredentials.findOne({ where: { userId } });


      if (!user) {
        throwError(404, "user not found")
      }

      if (user.dataValues.emailVerified) {
        throwError(409, "email already confirmed");
      }

      await user.update({ emailVerified: true });

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