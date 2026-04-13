import { GoogleCredentialSchema, LoginSchema, RegisterSchema, UpdatedPasswordSchema } from "@app/schemas/index.js";
import { IAuthSession } from "@app/types/index.js";

export interface IAuthService {
  login(data: LoginSchema): Promise<{ status: number; message: string; session?: string; }>;
  register(data: RegisterSchema): Promise<{ status: number; session: string; message?: string; } | { status: number; message: string; session?: string; }>;
  requestNewPassword(email: string, recaptchaToken: string): Promise<{ status: number; message: string; }>;
  updatePassword(data: UpdatedPasswordSchema): Promise<{ status: number; message: string; }>;
  google(data: GoogleCredentialSchema): Promise<{ status: number; message: string; session?: string; }>;
  confirmEmail(email: string, session: IAuthSession): Promise<{ status: number; message: string; }>;
  updateConfirmEmail(token: string): Promise<{ status: number; message: string; session?: string; }>;
}