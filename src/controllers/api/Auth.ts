import { GoogleCredentialSchema, LoginSchema, RegisterSchema, UpdatedPasswordSchema } from "@app/schemas";
import { AuthService } from "@app/services";
import { BodyParams, Controller, Inject, Post, QueryParams, Res } from "@tsed/common";
import { Description, Name, Patch, Put, Summary } from "@tsed/schema";

@Controller('/auth')
@Name("Authentication")
@Description("Handles user authentication and registration.")
 
export class AuthController {

  @Inject() private auth: AuthService;

  @Post("/login")
  @Summary("Authenticates a user using their login credentials.")
  async Auth(@Res() resp: Res, @BodyParams() data: LoginSchema) {
    const response = await this.auth.login(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/register")
  @Summary("Registers a new user with the provided details.")
  async Register(@Res() resp: Res, @BodyParams() data: RegisterSchema) {
    const response = await this.auth.register(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/password")
  @Summary("Requests a verification code to reset the user's password.")
  async RequestNewPassword(@Res() resp: Res, @BodyParams("email") email: string) {
    const response = await this.auth.requestNewPassword(email);
    return resp.status(response.status).json({ ...response });
  }

  @Put("/password")
  @Summary("Updates the user's password using the verification code.")
  async UpdatePassword(@Res() resp: Res, @BodyParams() data: UpdatedPasswordSchema) {
    const response = await this.auth.updatePassword(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/google")
  @Summary("auth google")
  async Google(@Res() resp: Res, @BodyParams() data: GoogleCredentialSchema) {
    const response = await this.auth.google(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/confirm-email")
  @Summary("confirm email")
  async ConfirmEmail(@Res() resp: Res, @BodyParams("email") email: string) {
    const response = await this.auth.confirmEmail(email);
    return resp.status(response.status).json({ ...response });
  }


  @Patch("/confirm-email")
  @Summary("confirm email")
  async UpdateConfirmEmail(@Res() resp: Res, @QueryParams("token") token: string) {
    const response = await this.auth.updateConfirmEmail(token);
    return resp.status(response.status).json({ ...response });
  }

}
