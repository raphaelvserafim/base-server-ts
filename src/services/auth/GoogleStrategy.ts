import { OAuth2Client } from 'google-auth-library';
import { config } from '@app/config/index.js';
import { throwError, } from '@app/utils/index.js';
import { SessionService } from '@app/services/index.js';
import { IGoogleTokens, PROVIDERS } from '@app/interfaces/index.js';
import { TokenPayload } from 'google-auth-library';
import { UserProvidersEntity, UsersEntity } from '@app/database';

interface GoogleAuthInput {
  credential: string;
  clientId: string;
}

interface AuthResult {
  status: number;
  session: string;
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    picture?: string;
  };
}

interface CreateUserData {
  name?: string;
  picture?: string;
}

interface RefreshTokenResult {
  tokens: IGoogleTokens;
  isValid: boolean;
}

export class GoogleStrategy {
  private readonly CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ] as const;

  private readonly AUTH_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ] as const;

  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  /**
   * Gera URL de autenticação para Google Calendar
   */
  getAuthUrlCalendar(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: Array.from(this.CALENDAR_SCOPES),
      prompt: 'consent',
      include_granted_scopes: true
    });
  }

  /**
   * Gera URL de autenticação básica (login)
   */
  getAuthUrlLogin(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: Array.from(this.AUTH_SCOPES),
      prompt: 'consent',
      include_granted_scopes: true
    });
  }

  /**
   * Obtém tokens a partir do código de autorização
   */
  async getTokensFromCode(authCode: string): Promise<IGoogleTokens> {
    if (!authCode?.trim()) {
      throwError(400, 'Authorization code is required');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(authCode);

      if (!tokens.access_token) {
        throwError(400, 'Failed to retrieve access token');
      }

      this.oauth2Client.setCredentials(tokens);
      return tokens as IGoogleTokens;
    } catch (error) {
      console.error('Token exchange failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('invalid_grant')) {
          throwError(400, 'Authorization code expired or invalid');
        }
        if (error.message.includes('redirect_uri_mismatch')) {
          throwError(400, 'Redirect URI mismatch');
        }
      }

      throwError(500, 'Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Configura tokens no cliente OAuth2
   */
  setTokens(tokens: IGoogleTokens): void {
    if (!tokens?.access_token) {
      throwError(400, 'Valid tokens are required');
    }
    this.oauth2Client.setCredentials(tokens);
  }

  async getAccessToken() {
    try {
      const { token } = await this.oauth2Client.getAccessToken();
      return token;
    } catch (error) {
      throwError(500, 'Failed to retrieve access token');
    }
  }
  /**
   * Verifica se os tokens são válidos e tenta renovar se necessário
   */
  async isTokenValid(tokens: IGoogleTokens): Promise<boolean> {
    if (!tokens?.access_token) {
      return false;
    }

    try {
      this.oauth2Client.setCredentials(tokens);
      await this.oauth2Client.getAccessToken();
      return true;
    } catch (error) {
      console.warn('Token validation failed:', error);

      // Tenta renovar o token se tiver refresh_token
      if (tokens.refresh_token) {
        try {
          const refreshResult = await this.refreshTokens(tokens);
          return refreshResult.isValid;
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
        }
      }

      return false;
    }
  }

  /**
   * Renova tokens usando refresh_token
   */
  async refreshTokens(tokens: IGoogleTokens): Promise<RefreshTokenResult> {
    if (!tokens.refresh_token) {
      return { tokens, isValid: false };
    }

    try {
      this.oauth2Client.setCredentials(tokens);
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      const refreshedTokens = {
        ...tokens,
        ...credentials,
        // Preserva refresh_token se não foi retornado um novo
        refresh_token: credentials.refresh_token || tokens.refresh_token
      } as IGoogleTokens;

      this.oauth2Client.setCredentials(refreshedTokens);

      return {
        tokens: refreshedTokens,
        isValid: true
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return { tokens, isValid: false };
    }
  }

  /**
   * Revoga tokens (logout)
   */
  async revokeTokens(tokens: IGoogleTokens): Promise<boolean> {
    try {
      if (tokens.access_token) {
        await this.oauth2Client.revokeToken(tokens.access_token);
      }
      return true;
    } catch (error) {
      console.error('Token revocation failed:', error);
      return false;
    }
  }

  /**
   * Cria e retorna uma instância do OAuth2Client
   */
  getOAuthClient(): OAuth2Client {
    return this.oauth2Client;
  }

  /**
   * Autentica usuário usando credenciais do Google
   */
  async authenticate({ credential, clientId }: GoogleAuthInput): Promise<AuthResult> {
    if (!credential?.trim()) {
      throwError(400, 'Credential is required');
    }

    if (!clientId?.trim()) {
      throwError(400, 'Client ID is required');
    }

    try {
      const payload = await this.verifyGoogleCredential(credential, clientId);
      const userResult = await this.findOrCreateUser(payload);
      const session = SessionService.generate({ userId: userResult.userId });

      return {
        status: 200,
        session,
        message: 'Authentication successful',
        user: userResult.user
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Verifica credenciais do Google ID Token
   */
  private async verifyGoogleCredential(
    credential: string,
    audience: string
  ): Promise<TokenPayload> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: credential,
        audience
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throwError(401, 'Invalid Google credentials');
      }

      // Verificações adicionais de segurança
      if (!payload.email_verified) {
        throwError(401, 'Email not verified by Google');
      }

      return payload;
    } catch (error) {
      console.error('Google credential verification failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('Wrong number of segments')) {
          throwError(400, 'Invalid token format');
        }
        if (error.message.includes('Token used too late')) {
          throwError(401, 'Token expired');
        }
      }

      throwError(401, 'Failed to verify Google credentials');
    }
  }

  /**
   * Encontra usuário existente ou cria novo
   */
  private async findOrCreateUser(payload: TokenPayload): Promise<{
    userId: number;
    user: {
      id: number;
      name: string;
      email: string;
      picture?: string;
    }
  }> {
    const { email, name, picture, sub, locale } = payload;

    if (!sub) {
      throwError(400, 'Google subject ID (sub) is required');
    }

    if (!email) {
      throwError(400, 'Email is required from Google profile');
    }

    try {
      // Verifica se já existe provider vinculado
      const existingUserId = await this.findExistingProvider(sub);
      if (existingUserId) {
        const user = await this.getUserById(existingUserId);
        return { userId: existingUserId, user };
      }

      // Verifica se usuário já existe por email
      const existingUserByEmail = await this.findExistingUserByEmail(email);
      if (existingUserByEmail) {
        await this.linkProviderToUser(existingUserByEmail, sub, locale, picture);
        const user = await this.getUserById(existingUserByEmail);
        return { userId: existingUserByEmail, user };
      }

      // Cria novo usuário usando transação
      const newUserId = await this.createNewUserWithTransaction({ name, picture }, email, sub, locale);
      const user = await this.getUserById(newUserId);

      return { userId: newUserId, user };
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  /**
   * Obtém dados do usuário por ID
   */
  private async getUserById(userId: number): Promise<{
    id: number;
    name: string;
    email: string;
    picture?: string;
  }> {
    const user = await UsersEntity.findByPk(userId);

    if (!user || !user.dataValues?.password) {
      throwError(404, 'User not found');
    }

    return {
      id: userId,
      name: user.dataValues.name || '',
      email: user.dataValues.email || '',
      picture: user.dataValues.picture || undefined
    };
  }

  /**
   * Verifica se já existe provider vinculado
   */
  private async findExistingProvider(googleSubId: string): Promise<number | null> {
    const existingProvider = await UserProvidersEntity.findOne({
      where: {
        provider: PROVIDERS.GOOGLE,
        clientId: googleSubId,
      },
    });

    return existingProvider ? Number(existingProvider.dataValues.userId) : null;
  }

  /**
   * Encontra usuário existente por email
   */
  private async findExistingUserByEmail(email: string): Promise<number | null> {

    return 0;
  }

  /**
   * Cria novo usuário com transação para garantir consistência
   */
  private async createNewUserWithTransaction(
    userData: CreateUserData,
    email: string,
    googleSubId: string,
    locale?: string
  ): Promise<number> {

    try {




      return 0;
    } catch (error) {
      console.error('Error creating new user:', error);
      throw error;
    }
  }

  /**
   * Vincula provider ao usuário
   */
  private async linkProviderToUser(
    userId: number,
    googleSubId: string,
    locale?: string,
    picture?: string
  ): Promise<void> {
    try {
      // Evita duplicação de provider
      const existingLink = await UserProvidersEntity.findOne({
        where: {
          userId,
          provider: PROVIDERS.GOOGLE,
          clientId: googleSubId,
        },
      });

      if (!existingLink) {
        /*
        await UserProvidersEntity.create({
          userId,
          provider: 'GOOGLE' as PROVIDERS,
          clientId: googleSubId,
          locale: locale?.trim() || '',
          picture: picture || '',
        });
        */
      } else {
        // Atualiza informações se necessário
        await existingLink.update({
          locale: locale?.trim() || existingLink.dataValues.locale,
          picture: picture || existingLink.dataValues.picture,
        });
      }
    } catch (error) {
      console.error('Error linking provider to user:', error);
      throw error;
    }
  }

  /**
   * Remove vinculação do provider Google
   */
  async unlinkGoogleProvider(userId: number, googleSubId: string): Promise<boolean> {
    try {
      const deleted = await UserProvidersEntity.destroy({
        where: {
          userId,
          provider: PROVIDERS.GOOGLE,
          clientId: googleSubId,
        },
      });

      return deleted > 0;
    } catch (error) {
      console.error('Error unlinking Google provider:', error);
      return false;
    }
  }


}