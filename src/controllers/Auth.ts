import { Login, Register, UpdatedPassword } from "../models/Auth";
import { ServiceAuth } from "../services/Auth";
import { BodyParams, Controller, Post, Description, Delete, QueryParams, Email, HeaderParams } from "@tsed/common";

@Controller('/auth')
export class AuthController {

  @Post("/login")
  @Description("Endpoint para autenticação de login")
  async Auth(@BodyParams() data: Login) {
    return await ServiceAuth.login(data);
  }

  @Post("/register")
  @Description("Endpoint para criar uma conta")
  async Register(@BodyParams() data: Register) {
    return await ServiceAuth.register(data);
  }

  @Post("/new-password")
  @Description("Endpoint para solicitar codigo redefinir senha")
  async RequestNewPassword(@BodyParams("email") email: string) {
    return await ServiceAuth.requestNewPassword(email);
  }

  @Post("/update-password")
  @Description("Endpoint para salvar nova senha")
  async UpdatePassword(@BodyParams() data: UpdatedPassword,) {
    return await ServiceAuth.updatePassword(data);
  }


}
