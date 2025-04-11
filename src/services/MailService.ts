import ejs from 'ejs';
import { config } from '@app/config';
import { IEmailProvider } from '@app/interfaces';
export class MailService {
  constructor(private provider: IEmailProvider) { }


  async sendCodeNewPassword(email: string, name: string, code: string) {
    const html = await ejs.renderFile('./views/templates/email/password-recovery.ejs', {
      name,
      code,
      SYSTEM_NAME: config.system.name
    });

    await this.provider.send({
      from: `${config.system.name}<no-reply-reset-password@${config.system.domain}>`,
      to: email,
      subject: `Password Recovery - ${config.system.name}`,
      html,
    });

  }
}