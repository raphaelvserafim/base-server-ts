import { IEmailProvider } from '@app/interfaces';
import sgMail from '@sendgrid/mail';
import { config } from '@app/config';

export class SendGridProvider implements IEmailProvider {

  constructor() {
    sgMail.setApiKey(config.email.sendGrid.apiKey);
  }

  async send({ to, from, subject, html }: { to: string, from: string, subject: string, html: string }): Promise<void> {
    await sgMail.send({ to, from, subject, html });
  }
}