import { Sequelize } from "sequelize";
import { dbConfig } from "@app/config/database.js";

export class DB {
  private static instance: Sequelize;
  private constructor() { }

  static getInstance(): Sequelize {
    if (!DB.instance) {
      DB.instance = new Sequelize(
        dbConfig.database,
        dbConfig.user,
        dbConfig.password,
        { ...dbConfig.options, }
      );
    }

    return DB.instance;
  }

  static async connect(): Promise<void> {
    const db = DB.getInstance();
    await db.authenticate();
    console.log('✅ Database connected successfully');
  }
}