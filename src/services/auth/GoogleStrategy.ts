import { OAuth2Client } from 'google-auth-library';
import { config } from '@app/config';
import { throwError, generateRandomToken } from '@app/utils';
import { Users, UserProviders } from '@app/database';
import { SessionService } from '@app/services';
import { PROVIDERS } from '@app/interfaces';

interface GoogleAuthInput {
  credential: string;
  clientId: string;
}

export class GoogleStrategy {

  static async authenticate({ credential, clientId }: GoogleAuthInput): Promise<{ status: number; session: string; message: string }> {
    const payload = await this.verifyGoogleCredential(credential, clientId);
    const userId = await this.findOrCreateUser(payload);
    const session = SessionService.generate({ userId });

    return {
      status: 200,
      session,
      message: 'Authenticated',
    };
  }

  private static async verifyGoogleCredential(credential: string, audience: string) {
    const client = new OAuth2Client(config.google.clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience });
    const payload = ticket.getPayload();

    if (!payload) {
      throwError(409, 'Invalid Google credentials');
    }

    return payload;
  }

  private static async findOrCreateUser(payload: any): Promise<number> {
    const { email, name, picture = '', sub, locale = '' } = payload;

    if (!sub) throwError(400, 'Missing Google sub ID');
    const providerData = { provider: 'google' as PROVIDERS, clientId: sub };

    const existingProvider = await UserProviders.findOne({ where: providerData });

    if (existingProvider) {
      return Number(existingProvider.dataValues.userId);
    }

    if (!email) throwError(400, 'Email not found');

    let user = await Users.findOne({ where: { email } });

    if (!user) {
      user = await Users.create({
        name: name || 'Unknown',
        email,
        password: generateRandomToken(10),
        emailVerified: true,
        picture,
      });
    }

    await UserProviders.create({
      userId: Number(user.dataValues.id),
      provider: providerData.provider,
      clientId: providerData.clientId,
      locale,
      picture,
    });

    return Number(user.dataValues.id);
  }
}