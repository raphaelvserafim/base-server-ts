export interface IUserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  picture?: string;
}

export interface IAuthSession {
  userId: number;
}


export enum PROVIDERS {
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

export interface IUserProvidersAttributes {
  id?: number;
  userId: number;
  clientId: string;
  provider: PROVIDERS;
  locale: string;
  picture: string;
}