import { IAuthSession, ICalendarService, IMeetingData } from "@app/interfaces";
import { GoogleCalendar } from "./GoogleCalendar";
import { throwError } from "@app/utils";
import { GoogleTokenManager } from "./GoogleTokenManager";

export class CalendarService implements ICalendarService {
  
  private calendar: GoogleCalendar;

  constructor(session: IAuthSession) {
    this.calendar = new GoogleCalendar();
    this.initialize(session);
  }

  private initialize(session: IAuthSession): void {
    const tokens = GoogleTokenManager.loadTokens(session);
    if (tokens) {
      this.calendar.setTokens(tokens);
    }
  }

  async setup(session: IAuthSession): Promise<{ status: number; url?: string; message: string }> {
    if (GoogleTokenManager.hasTokens(session)) {
      return { status: 200, message: 'Google Calendar is already configured.' };
    }
    const uri = this.calendar.getAuthUrl();
    return { status: 401, url: uri, message: 'Please authorize the application.' };
  }


  async authorizeWithCode(authCode: string, session: IAuthSession): Promise<void> {
    try {
      const tokens = await this.calendar.authorize(authCode);
      GoogleTokenManager.saveTokens(tokens, session);
      this.calendar.setTokens(tokens);
      console.log('✅ Google Calendar authorized successfully.');
    } catch (error) {
      throwError(400, 'Failed to authorize with Google Calendar. Please check the authorization code.');
    }
  }


  async createMeeting(meetingData: IMeetingData, session: IAuthSession): Promise<{ status: number; message: string }> {
    try {
      if (!GoogleTokenManager.hasTokens(session)) {
        throwError(400, "Google Calendar is not configured. Please authorize first.");
      }
      return await this.calendar.createMeeting(meetingData);
    } catch (error) {
      throwError(400, 'Failed to create meeting.');
    }
  }

  async isTimeSlotAvailable(datetime: Date, durationMinutes: number = 60): Promise<boolean> {
    try {
      return await this.calendar.isTimeSlotAvailable(datetime, durationMinutes);
    } catch (error) {
      throwError(400, 'Failed to check time slot availability.');
    }
  }


  async findAvailableSlots(
    preferredDateTime: Date,
    daysRange: number = 7,
    durationMinutes: number = 60
  ): Promise<Date[]> {
    try {
      const slots: Date[] = [];
      const startDate = new Date(preferredDateTime);
      startDate.setHours(9, 0, 0, 0);
      for (let day = 0; day < daysRange; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);

        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          continue;
        }

        for (let hour = 9; hour <= 17; hour++) {
          const slotTime = new Date(currentDate);
          slotTime.setHours(hour, 0, 0, 0);

          const isAvailable = await this.isTimeSlotAvailable(slotTime, durationMinutes);
          if (isAvailable) {
            slots.push(slotTime);
          }
          if (slots.length >= 5) {
            return slots;
          }
        }
      }

      return slots;
    } catch (error) {
      console.error('Error finding available slots:', error);
      return [];
    }
  }


  async getTodaysEvents() {
    return await this.calendar.getTodaysEvents();
  }


}
