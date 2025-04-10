import { IEmailProvider } from '@app/interfaces';
import { SendGridProvider } from '@app/providers';
import { config } from '@app/config';

export class EmailProviderFactory {

  static create(): IEmailProvider {
    const provider = config.email.provider;
    switch (provider) {
      case 'sendgrid':
        return new SendGridProvider();

      default:
        throw new Error('Invalid email provider');
    }
  }
}