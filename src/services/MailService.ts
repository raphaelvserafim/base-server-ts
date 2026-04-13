
import fs from 'fs';
import { config } from '@app/config/index.js';
import { IEmailProvider } from '@app/interfaces/index.js';
import { throwError } from '@app/utils';
export class MailService {
  constructor(private provider: IEmailProvider) { }

  async sendCodeNewPassword(email: string, name: string, code: string) {
    try {
      const htmlTemplate = fs.readFileSync('./html/templates/reset.password.html', 'utf-8');
      const replacements = {
        '{{reset_link}}': config.system.urlFront + '/new-password?code=' + code,
        '{{name}}': name,
        '{{system_name}}': config.system.name,
        '{{system_logo}}': config.system.logo,
        '{{website_url}}': config.system.urlFront,
        '{{support_url}}': config.system.urlFront + '/contact',
        '{{privacy_url}}': config.system.urlFront + '/privacy',
      };

      const emailHtml = Object.entries(replacements).reduce((html: any, [placeholder, value]) => html?.replaceAll(placeholder, value), htmlTemplate);
      const data = {
        to: email,
        from: `notreply@${config.system.domain}`,
        subject: "Recuperação de Senha",
        html: emailHtml
      }

      await this.provider.send(data);

    } catch (error) {
      throwError(400, 'Erro ao enviar email de recuperação de senha.');
    }
  }


  async sendConfirmEmail(email: string, name: string, code: string) {
    try {
      const htmlTemplate = fs.readFileSync('./html/templates/confirm.email.html', 'utf-8');
      const replacements = {
        '{{verification_code}}': code,
        '{{name}}': name,
        '{{system_name}}': config.system.name,
        '{{system_logo}}': config.system.logo,
      };

      const emailHtml = Object.entries(replacements).reduce((html: any, [placeholder, value]) => html?.replaceAll(placeholder, value), htmlTemplate);
      const payload = {
        to: email,
        from: `notreply@${config.system.domain}`,
        subject: "Confirmação de Email",
        html: emailHtml
      }

      await this.provider.send(payload);
    } catch (error) {
      throwError(400, 'Erro ao enviar email de confirmação.');
    }
  }

}