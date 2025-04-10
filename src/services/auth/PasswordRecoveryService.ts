import { Users, NewPasswords } from "@app/database";
import { Mail } from "@app/services";
import { throwError } from "@app/utils";
import { AuthUtils } from "./AuthUtils";

export class PasswordRecoveryService {

  static async request(email: string) {
    if (!email) throwError(400, "email not found");

    
    const user = await Users.findOne({ where: { email } });
    if (!user?.dataValues.id) throwError(404, "email not found");

    const userId = user.dataValues.id;
    const existing = await NewPasswords.findOne({ where: { userId } });
    if (existing?.dataValues.id) throwError(400, "code already sent");

    const token = String(Math.floor(10000 + Math.random() * 90000));
    const expire = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await NewPasswords.create({ userId, token, status: 1, expire });

    await Mail.sendCodeNewPassword(email, user.dataValues.name, token);

    return { status: 201, message: "Code sent to your email" };
  }


  static async update(code: string, password: string) {
    const reset = await NewPasswords.findOne({ where: { token: code } });
    if (!reset) throwError(404, "code not found");
    if (!reset.dataValues.status) throwError(400, "code already used");

    const hashed = await AuthUtils.encryptPassword(password);
    await Users.update({ password: hashed }, { where: { id: reset.dataValues.userId } });
    await NewPasswords.update({ status: 2 }, { where: { token: code } });

    return { status: 200, message: "Updated successfully" };
  }
}