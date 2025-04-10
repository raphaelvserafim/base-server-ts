import { config } from '@app/config';
import { IEmailProvider } from '@app/interfaces';
import fs from 'fs';

export class MailService {
  constructor(private provider: IEmailProvider) { }


  async sendCodeNewPassword(email: string, name: string, code: string) {
    const template = fs.readFileSync('./html/resetPasswordTemplate.html', 'utf-8');
    const html = template
      .split('{{code}}').join(code)
      .split('{{name}}').join(name)
      .split('{{SYSTEM_NAME}}').join(config.system.name);

    await this.provider.send(`${config.system.name}<no-reply-reset-password@${config.system.domain}>`, email, "Reset your password", html);
  }
}