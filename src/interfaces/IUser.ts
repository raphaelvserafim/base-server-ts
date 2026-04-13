export interface IUserAttributes {
  id?: number;
  name: string;
  picture?: string;
}

export interface IUserCredentials {
  id?: number;
  userId: number;
  email: string;
  emailVerified: boolean;
  password: string;
  user?: IUserAttributes;
}
 

export enum PROVIDERS {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  EMAIL = "email",
}

export interface IUserProvidersAttributes {
  id?: number;
  userId: number;
  clientId: string;
  provider: PROVIDERS;
  locale: string;
  picture: string;
}

export interface IUserService {
  userByEmail(email: string): Promise<IUserAttributes | null>;
  userCreate(data: IUserAttributes): Promise<IUserAttributes>;
  userUpdatePassword(password: string, userId: number): Promise<void>;
  userProviders(userId: number): Promise<IUserProvidersAttributes[]>;
}