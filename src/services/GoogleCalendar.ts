import { IGoogleTokens, IMeetingData } from '@app/interfaces';
import { calendar_v3, google } from 'googleapis';
import { GoogleStrategy } from './auth';

export class GoogleCalendar {
  private oauth2Client: GoogleStrategy;

  /**
   * Obtém URL de autorização
   */
  getAuthUrl(): string {
    return this.oauth2Client.getAuthUrlCalendar();
  }

  /**
   * Configura os tokens de acesso
   */
  setTokens(tokens: IGoogleTokens): void {
    this.oauth2Client.setTokens(tokens);
  }


  /**
   * Autoriza usando código de autorização
   */
  async authorize(authCode: string): Promise<IGoogleTokens> {
    const googleStrategy = new GoogleStrategy();
    const tokens = await googleStrategy.getTokensFromCode(authCode);
    this.setTokens(tokens);
    return tokens;
  }

  /**
   * Obtém instância do Google Calendar API
   */
  private getCalendarInstance(): calendar_v3.Calendar {

    this.oauth2Client = new GoogleStrategy();

    if (!this.oauth2Client.getAccessToken()) {
      throw new Error('Google Calendar is not authenticated. Please authorize first.');
    }

    return google.calendar({
      version: 'v3',
      auth: this.oauth2Client.getOAuthClient(),
    });
  }

  /**
   * Verifica se os tokens são válidos antes de usar
   */
  private async ensureValidTokens(): Promise<void> {
    try {
      await this.oauth2Client.getAccessToken();
    } catch (error) {
      throw new Error('Invalid or expired tokens. Please re-authenticate.');
    }
  }

  /**
   * Cria uma nova reunião no Google Calendar
   */
  async createMeeting(meetingData: IMeetingData): Promise<{ status: number; message: string; eventId?: string }> {
    const { title, dateTime, attendees, duration = 60, description = '', location = '' } = meetingData;

    try {
      await this.ensureValidTokens();

      const start = new Date(dateTime);
      const end = new Date(start.getTime() + duration * 60000);

      const event = {
        summary: title,
        description: description,
        location: location,
        start: {
          dateTime: start.toISOString(),
          timeZone: 'America/Cuiaba',
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: 'America/Cuiaba',
        },
        attendees: attendees.map(email => ({
          email,
          responseStatus: 'needsAction'
        })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ]
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const calendar = this.getCalendarInstance();
      const result = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all',
        conferenceDataVersion: 1
      });

      console.log('Meeting created:', result.data.id);

      return {
        status: 201,
        message: 'Meeting created successfully.',
        eventId: result.data.id || undefined
      };

    } catch (error) {
      console.error('Error creating meeting:', error);
      throw new Error(`Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtém eventos do dia atual
   */
  async getTodaysEvents(): Promise<Array<{
    title: string;
    start: string | null;
    id: string;
    location?: string;
    attendees?: string[];
  }>> {
    try {
      await this.ensureValidTokens();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const calendar = this.getCalendarInstance();
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: today.toISOString(),
        timeMax: tomorrow.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items?.map(event => ({
        title: event.summary || 'Sem título',
        start: event.start?.dateTime || event.start?.date || null,
        id: event.id || '',
        location: event.location || undefined,
        attendees: event.attendees?.map(attendee => attendee.email || '') || undefined
      })) || [];

    } catch (error) {
      console.error('Error listing today\'s events:', error);
      return [];
    }
  }

  /**
   * Verifica se um horário está disponível
   */
  async isTimeSlotAvailable(datetime: Date, durationMinutes: number = 60): Promise<boolean> {
    try {
      await this.ensureValidTokens();

      const endTime = new Date(datetime.getTime() + durationMinutes * 60 * 1000);

      const calendar = this.getCalendarInstance();
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: datetime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return !response.data.items || response.data.items.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Obtém próximos eventos
   */
  async getUpcomingEvents(maxResults: number = 10): Promise<Array<{
    id: string;
    title: string;
    start: string | null;
    end: string | null;
    location?: string;
    description?: string;
    attendees?: string[];
  }>> {
    try {
      await this.ensureValidTokens();

      const calendar = this.getCalendarInstance();
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items?.map(event => ({
        id: event.id || '',
        title: event.summary || 'Sem título',
        start: event.start?.dateTime || event.start?.date || null,
        end: event.end?.dateTime || event.end?.date || null,
        location: event.location || undefined,
        description: event.description || undefined,
        attendees: event.attendees?.map(attendee => attendee.email || '') || undefined
      })) || [];

    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Atualiza um evento existente
   */
  async updateEvent(eventId: string, updates: Partial<IMeetingData>): Promise<{ status: number; message: string }> {
    try {
      await this.ensureValidTokens();

      const calendar = this.getCalendarInstance();

      // Primeiro, obter o evento atual
      const currentEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      // Preparar atualizações
      const eventUpdates: any = { ...currentEvent.data };

      if (updates.title) eventUpdates.summary = updates.title;
      if (updates.description) eventUpdates.description = updates.description;
      if (updates.location) eventUpdates.location = updates.location;
      if (updates.attendees) {
        eventUpdates.attendees = updates.attendees.map(email => ({ email }));
      }

      if (updates.dateTime && updates.duration) {
        const start = new Date(updates.dateTime);
        const end = new Date(start.getTime() + updates.duration * 60000);

        eventUpdates.start = {
          dateTime: start.toISOString(),
          timeZone: 'America/Sao_Paulo',
        };
        eventUpdates.end = {
          dateTime: end.toISOString(),
          timeZone: 'America/Sao_Paulo',
        };
      }

      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: eventUpdates,
        sendUpdates: 'all'
      });

      return {
        status: 200,
        message: 'Event updated successfully.'
      };

    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deleta um evento
   */
  async deleteEvent(eventId: string): Promise<{ status: number; message: string }> {
    try {
      await this.ensureValidTokens();

      const calendar = this.getCalendarInstance();
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });

      return {
        status: 200,
        message: 'Event deleted successfully.'
      };

    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifica disponibilidade em múltiplos horários
   */
  async checkMultipleTimeSlots(
    timeSlots: Array<{ datetime: Date; duration: number }>
  ): Promise<Array<{ datetime: Date; duration: number; available: boolean }>> {
    const results = [];

    for (const slot of timeSlots) {
      try {
        const available = await this.isTimeSlotAvailable(slot.datetime, slot.duration);
        results.push({ ...slot, available });
      } catch (error) {
        console.error(`Error checking slot ${slot.datetime}:`, error);
        results.push({ ...slot, available: false });
      }
    }

    return results;
  }
}