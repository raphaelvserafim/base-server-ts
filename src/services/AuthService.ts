import { OAuth2Client } from 'google-auth-library';
import { config } from '@app/config/index.js';
import { extractNumbers, returnError, throwError } from "@app/utils/index.js";
import { AuthUtils, EmailVerificationCodeService, PasswordRecoveryService, RecaptchaValidator, SessionService } from '@app/services/index.js';
import { LoginSchema, RegisterSchema, UpdatedPasswordSchema, GoogleCredentialSchema } from '@app/schemas/index.js';

import { IAuthService, } from '@app/interfaces/index.js';
import { AuthValidator } from '@app/validators/index.js';
import { UserProvidersEntity, UsersEntity } from '@app/database/index.js';
import { IAuthSession, IUserPermission, PROVIDERS, UsersAttributes } from '@app/types/index.js';


export class AuthService implements IAuthService {

  async login(data: LoginSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {
      AuthValidator.validateLogin(data);

      const user = await UsersEntity.findOne({ where: { email: data.email } });

      if (!user) {
        throwError(404, "email not found");
      }

      const userId = Number(user.dataValues.id);
      const password = user.dataValues.password;

      const validPassword = await AuthUtils.comparePassword(data.password, password);

      if (!validPassword) {
        throwError(401, "invalid password");
      }

      const session = await SessionService.session(userId);

      return { status: 200, message: "success", session };
    } catch (error) {
      return returnError(error);
    }
  }


  async register(data: RegisterSchema): Promise<{ status: number; message: string; session?: string; }> {
    try {
      AuthValidator.validateRegister(data);

      await RecaptchaValidator.verify(data.recaptchaToken);


      const user = await UsersEntity.findOne({ where: { email: data.email } });

      if (user) {
        throwError(400, "email already registered");
      }

      const hashedPassword = await AuthUtils.encryptPassword(data.password);
      if (!hashedPassword) {
        throwError(400, "error hashing password");
      }

      const userData: UsersAttributes = {
        name: data.name,
        email: data.email,
        phone: extractNumbers(data.phone) ? "+" + extractNumbers(data.phone) : "",
        emailVerified: false,
        password: hashedPassword,
        isAffiliated: false,
        percentage: 0,
        credits: 0,
        permission: IUserPermission.USER
      };


      const newUser = await UsersEntity.create(userData);

      const userId = Number(newUser.dataValues.id);

      if (!userId) {
        throwError(400, "error creating user");
      }

      const session = await SessionService.session(userId);

      return { status: 201, session: session, message: "success", };
    } catch (error) {
      return returnError(error);
    }
  }


  async requestNewPassword(email: string, recaptchaToken: string): Promise<{ status: number; message: string; }> {
    try {
      await RecaptchaValidator.verify(recaptchaToken);
      return await PasswordRecoveryService.request({ email, });
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



  async confirmEmail(email: string, session: IAuthSession): Promise<{ status: number; message: string; }> {
    try {
      const user = await UsersEntity.findOne({ where: { email } });


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

      const user = await UsersEntity.findOne({ where: { id: userId } });


      if (!user) {
        throwError(404, "user not found")
      }

      if (user.dataValues.emailVerified) {
        throwError(409, "email already confirmed");
      }

      await user.update({ emailVerified: true });

      const session = await SessionService.session(userId);

      return { status: 200, session, message: "Email confirmed" };
    } catch (error) {
      return returnError(error);
    }
  }

  async verifyEmailCode(userId: number, code: string) {
    try {
      const isValid = await EmailVerificationCodeService.verifyCode(userId, code);

      if (!isValid) {
        throwError(400, "invalid or expired code")
      }

      const user = await UsersEntity.findByPk(userId);

      if (!user) {
        throwError(404, "user not found")
      }

      if (user.dataValues.emailVerified) {
        throwError(409, "email already confirmed");
      }

      await UsersEntity.update({ emailVerified: true, }, { where: { id: userId } });

      await EmailVerificationCodeService.deleteCode(userId);


      const session = await SessionService.session(userId);

      return { status: 200, session, message: "Email confirmed" };
    } catch (error) {
      return returnError(error);
    }
  }

  async google(data: GoogleCredentialSchema) {
    try {
      const { clientId, credential, } = data;
      const GoogleClient = new OAuth2Client(config.google.clientId);

      const ticket = await GoogleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throwError(409, "error google");
      }

      const email = payload.email;
      const name = payload.name as string;
      const picture = payload.picture || "";
      const sub = payload.sub;
      const locale = payload.locale || "";

      const check = await UserProvidersEntity.findOne({ where: { clientId: sub, provider: PROVIDERS.GOOGLE } });



      if (!check?.dataValues.userId && email) {
        const user = await UsersEntity.findOne({ where: { email } });
        if (!user?.dataValues.id) {


          const encrypt = await AuthUtils.encryptPassword(sub);

          const user = await UsersEntity.create({
            name,
            email,
            password: encrypt,
            emailVerified: true,
            phone: "",
            isAffiliated: false,
            percentage: 0,
            credits: 0,
            permission: IUserPermission.USER,
          });

          const userId = Number(user.dataValues.id);

          await UserProvidersEntity.create(
            {
              userId,
              clientId: sub,
              picture,
              locale,
              provider: PROVIDERS.GOOGLE
            });

          await UsersEntity.update({ emailVerified: true, picture, credits: 100 }, { where: { id: userId } });

          const session = await SessionService.session(userId);

          return { status: 200, session, message: "successfully" };

        } else {

          await UserProvidersEntity.create(
            {
              userId: user.dataValues.id,
              clientId: sub,
              picture,
              locale,
              provider: PROVIDERS.GOOGLE
            });

          const userId = Number(user.dataValues.id);

          if (!user?.dataValues?.emailVerified) {
            await UsersEntity.update({ emailVerified: true, picture, credits: 100 }, { where: { id: userId } });
          }


          const session = await SessionService.session(userId);

          return { status: 200, session, message: "successfully" };

        }

      } else {

        const user = await UsersEntity.findByPk(check?.dataValues.userId);

        if (!user) {
          throwError(409, "error google");
        }
        const userId = Number(user.dataValues.id);

        if (!user?.dataValues?.emailVerified) {
          await UsersEntity.update({ emailVerified: true, picture }, { where: { id: userId } });
        }


        const session = await SessionService.session(userId);

        return { status: 200, session, message: "successfully" };
      }

    } catch (error) {
      return returnError(error);
    }
  }


}