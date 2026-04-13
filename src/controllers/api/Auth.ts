import { BodyParams, Context, Controller, inject, Post, QueryParams, Res, UseBefore, } from "@tsed/common";
import { Description, Name, Patch, Put, Security, Summary } from "@tsed/schema";

import { Authenticated, AuthRateLimit, } from "@app/middlewares/index.js";
import { GoogleCredentialSchema, LoginSchema, RegisterSchema, UpdatedPasswordSchema } from "@app/schemas/index.js";
import { IAuthSession } from "@app/types/index.js";
import { AuthService } from "@app/services/index.js";


@Controller('/auth')
@Name("Auth")
@Security("BearerAuth")

export class AuthController {
  private auth = inject(AuthService);


  @Post("/login")
  @Description("Authenticates a user using their login credentials.")
  @UseBefore(AuthRateLimit)
  async Auth(@Res() resp: Res, @BodyParams() data: LoginSchema) {
    const response = await this.auth.login(data);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/register")
  @Description("Registers a new user with the provided details.")
  @UseBefore(AuthRateLimit)
  async Register(@Res() resp: Res, @BodyParams() data: RegisterSchema) {
    const response = await this.auth.register(data);
    return resp.status(response.status).json({ ...response, });
  }

  @Post("/password")
  @Description("Requests a verification code to reset the user's password.")
  @UseBefore(AuthRateLimit)
  async RequestNewPassword(@Res() resp: Res, @BodyParams("email") email: string, @BodyParams("recaptchaToken") recaptchaToken: string) {
    const response = await this.auth.requestNewPassword(email, recaptchaToken);
    return resp.status(response.status).json({ ...response, });
  }


  @Put("/password")
  @Description("Updates the user's password using the verification code.")
  @UseBefore(AuthRateLimit)
  async UpdatePassword(@Res() resp: Res, @BodyParams() data: UpdatedPasswordSchema) {
    const response = await this.auth.updatePassword(data);
    return resp.status(response.status).json({ ...response, });
  }


  @Post("/google")
  @Summary("auth google")
  @UseBefore(AuthRateLimit)
  async Google(@Res() resp: Res, @BodyParams() data: GoogleCredentialSchema) {
    const response = await this.auth.google(data);
    return resp.status(response.status).json({ ...response });
  }


  @Post("/confirm-email")
  @Summary("confirm email")
  @UseBefore(Authenticated)
  async ConfirmEmail(@Res() resp: Res, @Context("session") session: IAuthSession, @BodyParams("email") email: string) {
    const response = await this.auth.confirmEmail(email, session);
    return resp.status(response.status).json({ ...response });
  }


  @Patch("/confirm-email")
  @Summary("confirm email")
  async UpdateConfirmEmail(@Res() resp: Res, @QueryParams("token") token: string) {
    const response = await this.auth.updateConfirmEmail(token);
    return resp.status(response.status).json({ ...response });
  }

  @Post("/verify-email-code")
  @Summary("verify email code")
  @UseBefore(Authenticated)
  async VerifyEmailCode(@Res() resp: Res, @Context("session") session: IAuthSession, @BodyParams("code") code: string) {
    const response = await this.auth.verifyEmailCode(session.userId, code);
    return resp.status(response.status).json({ ...response });
  }


}
