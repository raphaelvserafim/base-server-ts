import { ISMSProvider } from "@app/interfaces/index.js";

export class SMSService {

  constructor(private provider: ISMSProvider) { }

  async sendConfirmationCode(phone: string, code: string) {
    const text = `Code: ${code}.`;
    await this.provider.send({
      from: "ServiceSMS",
      to: phone,
      text,
    });
  }


}