import { GoogleCredential, Login, Register, UpdatedPassword } from "@app/schema";
import { ServiceAuth } from "@app/services";
import { BodyParams, Controller, Post, Res } from "@tsed/common";
import { Description, Name, Put, Summary } from "@tsed/schema";

@Controller('/auth')
@Name("AuthController")
export class AuthController {

  constructor(private auth: ServiceAuth) { }

  @Post("/login")
  @Description("Authenticates a user using their login credentials.")
  async Auth(@Res() resp: Res, @BodyParams() data: Login) {
    const response = await this.auth.login(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/register")
  @Description("Registers a new user with the provided details.")
  async Register(@Res() resp: Res, @BodyParams() data: Register) {
    const response = await this.auth.register(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/password")
  @Description("Requests a verification code to reset the user's password.")
  async RequestNewPassword(@Res() resp: Res, @BodyParams("email") email: string) {
    const response = await this.auth.requestNewPassword(email);
    return resp.status(response.status).json({ ...response });
  }

  @Put("/password")
  @Description("Updates the user's password using the verification code.")
  async UpdatePassword(@Res() resp: Res, @BodyParams() data: UpdatedPassword) {
    const response = await this.auth.updatePassword(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/google")
  @Summary("auth google")
  async Google(@Res() resp: Res, @BodyParams() data: GoogleCredential) {
    const response = await this.auth.google(data);
    return resp.status(response.status).json({ ...response });
  }

}
