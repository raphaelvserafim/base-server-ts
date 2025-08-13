import { IAuthSession, IGoogleTokens, IGoogleTokenManager } from '@app/interfaces';
import fs from 'fs';

export class GoogleTokenManager {

  static async saveTokens(tokens: IGoogleTokens, session: IAuthSession) {
    try {
      const userId = session.userId;
      const userTokensPath = `./tokens/${userId}_tokens.json`;
      fs.writeFileSync(userTokensPath, JSON.stringify(tokens, null, 2));
      console.log('✅ Tokens saved successfully.');
    } catch (error) {
      console.error(error);
    }
  }

  static loadTokens(session: IAuthSession): IGoogleTokens | null {
    try {
      const userId = session.userId;
      const userTokensPath = `./tokens/${userId}_tokens.json`;
      if (!fs.existsSync(userTokensPath)) {
        return null;
      }
      const tokensData = fs.readFileSync(userTokensPath, 'utf8');
      return JSON.parse(tokensData);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static hasTokens(session: IAuthSession): boolean {
    const userId = session.userId;
    const userTokensPath = `./tokens/${userId}_tokens.json`;
    return fs.existsSync(userTokensPath);
  }

  static clearTokens(session: IAuthSession): void {
    try {
      const userId = session.userId;
      const userTokensPath = `./tokens/${userId}_tokens.json`;
      if (fs.existsSync(userTokensPath)) {
        fs.unlinkSync(userTokensPath);
        console.log('✅ Tokens cleared successfully.');
      }
    } catch (error) {
      console.error(error);
    }
  }

}