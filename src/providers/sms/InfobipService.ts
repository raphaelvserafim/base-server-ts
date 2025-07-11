import { ISMSProvider } from "@app/interfaces";

export class InfobipSmsService implements ISMSProvider {

  private baseUrl = 'https://api.infobip.com/sms/2/text/advanced';
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required for Infobip SMS service");
    }
    this.apiKey = apiKey;
  }

  async send({ from, to, text }: { from: string; to: string; text: string }): Promise<void> {
    const payload = {
      messages: [
        {
          destinations: [{ to }],
          from,
          text,
        },
      ],
    };
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `App ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    console.log("SMS sent successfully:", data);
    return data;
  }
}