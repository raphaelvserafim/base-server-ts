export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  picture?: string;
}

export interface AuthSession {
  userId: number;
}


export enum PROVIDERS {
  GOOGLE = "google",
  FACEBOOK = "facebook",
}

export interface UserProvidersAttributes {
  id?: number;
  userId: number;
  clientId: string;
  provider: PROVIDERS;
  locale: string;
  picture: string;
}