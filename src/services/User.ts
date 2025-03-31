import { Functions } from "@app/utils";
import { Register } from "@app/schema/Auth";
import { Users } from "@app/database";

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
      const password = await Functions.encryptPassword(data.password);
      return await Users.create({ name: data.name, email: data.email, password: password });
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
      const passwordEncrypt = await Functions.encryptPassword(password);
      return await Users.update({ password: passwordEncrypt }, { where: { id: user } });
    } catch (error) {
      throw error;
    }
  }
}