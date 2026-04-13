import { HeaderParams, RawBodyParams, Req, Res } from "@tsed/common";
import { Controller, inject } from "@tsed/di";
import { Name, Post } from "@tsed/schema";

import { ServiceWebhook } from "@app/services/index.js";

@Controller('/webhook')
@Name("Webhook")
export class WebhookController {
  private webhook = inject(ServiceWebhook);


  @Post("/stripe")
  async stripe(@Res() resp: Res, @HeaderParams("stripe-signature") signature: string, @RawBodyParams() body: Buffer) {
    this.webhook.stripe(signature, body);
    return resp.status(200).json({ access: true });
  }


  @Post("/pix")
  async pix(@Res() resp: Res, @Req() req: Req,) {
    return this.webhook.pix(req, resp);
  }

}
