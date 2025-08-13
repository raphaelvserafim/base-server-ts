import { IAuthSession } from "./IUser";

export interface IMeetingData {
  title: string;
  dateTime: string;
  attendees: string[];
  duration?: number;
  description?: string;
  location?: string;
}

export interface IMeetingResult {
  success: boolean;
  id?: string;
  message?: string;

}

export interface IGoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

export interface IGoogleTokenManager {
  saveTokens(tokens: IGoogleTokens, session: IAuthSession): Promise<void>;
  loadTokens(session: IAuthSession): IGoogleTokens | null;
  hasTokens(session: IAuthSession): boolean;
  clearTokens(session: IAuthSession): void;
}

export interface ICalendarService {
  setup(session: IAuthSession): Promise<{ status: number; url?: string; message: string }>;
  authorizeWithCode(authCode: string, session: IAuthSession): Promise<void>;
  createMeeting(meetingData: IMeetingData, session: IAuthSession): Promise<{ status: number; message: string }>;
  isTimeSlotAvailable(datetime: Date, durationMinutes?: number): Promise<boolean>;
}