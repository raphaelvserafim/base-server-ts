import { ISMSProvider } from '@app/interfaces';
import { InfobipSmsService } from '@app/providers';
import { config } from '@app/config';

export class SMSProviderFactory {

  static create(): ISMSProvider {
    const provider = config.sms.provider;
    switch (provider) {
      case 'infobip':
        return new InfobipSmsService(config.sms.infobip.apiKey);
      default:
        throw new Error('Invalid SMS provider');
    }
  }
}