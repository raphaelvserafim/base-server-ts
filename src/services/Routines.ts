import { CronJob } from 'cron';
import dayjs, { UnitTypeLong } from "dayjs";

export class Routines {
  private static instance: Routines;

  private constructor() { }

  static getInstance(): Routines {
    if (!this.instance) {
      this.instance = new Routines();
    }
    return this.instance;
  }

  everyMinute() {
    new CronJob("0 * * * * *", async () => {
      this.checking();
    }, null, true);
  }

  async checking() {
    console.log(`Executando a rotina: ${new Date().toISOString()}`);
  }
}