import { Sequelize } from "sequelize";
import { dbConfig } from "@app/config/database";

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

      DB.instance.authenticate()
        .then(() => console.log('✅ Database connected successfully'))
        .catch((error) => {
          console.error('❌ Unable to connect to the database');
        });
    }
    return DB.instance;
  }
}