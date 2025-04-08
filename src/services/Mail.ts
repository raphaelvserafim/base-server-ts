
import { config } from '@app/config';
import sgMail from '@sendgrid/mail';
import fs from 'fs';


export class Mail {

  static async sendCodeNewPassword(email: string, name: string, code: string): Promise<[sgMail.ClientResponse, {}]> {
    try {
      sgMail.setApiKey(config.email.sendGrid.apiKey);

      const htmlTemplate = fs.readFileSync('./html/resetPasswordTemplate.html', 'utf-8');
      const replacements = {
        '{{code}}': code,
        '{{name}}': name,
        '{{SYSTEM_NAME}}': config.system.name,
      };
      const emailHtml = Object.entries(replacements).reduce((html: any, [placeholder, value]) => html?.replaceAll(placeholder, value), htmlTemplate);
      const data = {
        to: email,
        from: `${config.system.name}<${config.system.emailNotifications}>`,
        subject: "Reset your password",
        html: emailHtml
      }
      return await sgMail.send(data);
    } catch (error) {
      throw error;
    }
  }


}