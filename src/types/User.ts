export enum IUserPermission {
  USER = 1,
  ADMIN = 2,
}

export interface UsersAttributes {
  id?: number;
  name: string;
  picture?: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  password: string;
  isAffiliated: boolean;
  percentage: number;
  credits: number;
  language?: string;
  timezone?: string;

  notificationEmailEnabled?: boolean;
  notificationUpdateSystem?: boolean;
  notificationPromotions?: boolean;

  permission: IUserPermission;

}

export interface NewPasswordsAttributes {
  id?: number;
  userId: number;
  token: string;
  status: boolean;
  expire: Date;
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



export interface AffilianteTransactionAttributes {
  id?: number;
  userId: number;
  amount: number;
  invoiceStripeId?: string;
  type: "withdraw" | "bonus";
  status: "pending" | "approved" | "rejected" | "paid";
  createdAt?: Date;
}



export interface UserNotificationsPushAttributes {
  id?: number;
  userId: number;
  endpoint: string;
  keysAuth: string;
  keysP256dh: string;
  platform: string;
  browser: string;
  os: string;
}