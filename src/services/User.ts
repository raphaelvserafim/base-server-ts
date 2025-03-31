import { Register } from "@app/schema/Auth";
import { UserProviders, Users } from "@app/database";
import { encryptPassword } from "@app/utils";

export class User {


  /**
   * Buscando no banco de dados Usuario pelo E-mail
   * @param email email de cadastro do usuario
   * @returns 
   */
  async userByEmail(email: string) {
    try {
      return await Users.findOne({ where: { email: email } });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Salvando o usuario no Banco de dados
   * @param data dados do usuario
   */
  async userCreate(data: Register) {
    try {
      const password = await encryptPassword(data.password);
      return await Users.create({ name: data.name, email: data.email, password: password, emailVerified: false });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizando senha do usuario
   * @param password 
   * @param user 
   * @returns 
   */
  async userUpdatePassword(password: string, user: number) {
    try {
      const passwordEncrypt = await encryptPassword(password);
      return await Users.update({ password: passwordEncrypt }, { where: { id: user } });
    } catch (error) {
      throw error;
    }
  }


  async userProviders(userId: number) {
    try {
      return await UserProviders.findAll({ where: { id: userId } });
    } catch (error) {
      throw error;
    }

  }
}