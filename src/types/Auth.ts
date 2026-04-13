import { IUserPermission } from "@app/types/index.js";

export interface IAuthSession {
  userId: number;
  emailVerified: boolean;
  email: string;
  permission: IUserPermission;
  mock: string;
}