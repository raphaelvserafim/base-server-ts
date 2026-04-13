import { throwError } from "@app/utils/index.js";
import { MailService, AuthUtils } from "@app/services/index.js";
import { EmailProviderFactory } from "@app/providers/index.js";
import { UsersEntity } from "@app/database/index.js";
import { EmailVerificationCodeService } from "@app/services/auth/index";

export class PasswordRecoveryService {

  static async request({ email }: { email: string, }) {
    if (!email) throwError(400, "email not found");

    const user = await UsersEntity.findOne({ where: { email } });

    if (!user) {
      throwError(404, "user not found")
    }

    if (user?.dataValues?.emailVerified) {
      throwError(409, "email already confirmed")
    }

    const code = EmailVerificationCodeService.generateCode();
    await EmailVerificationCodeService.storeCode(Number(user.dataValues.id), code);


    const Mail = new MailService(EmailProviderFactory.create());

    await Mail.sendCodeNewPassword(email, user.dataValues.name, code);


    return { status: 201, message: "Code sent to your email" };
  }




  static async update(code: string, password: string) {
    if (!code || !password) throwError(400, "code and password are required");

    const hashed = await AuthUtils.encryptPassword(password);



    return { status: 200, message: "Updated successfully" };
  }
}