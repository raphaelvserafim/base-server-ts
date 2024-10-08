import { Sequelize } from "sequelize";
import { getEnv } from '@app/config/env';

export class DB {
  private static instance: Sequelize;
  private constructor() { }

  static getInstance(): Sequelize {
    if (!DB.instance) {
      const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = getEnv();
      DB.instance = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
        host: DB_HOST,
        dialect: 'mysql',
        timezone: '-04:00',
        define: {
          underscored: true,
          freezeTableName: true,
        },
      });

      DB.instance.authenticate().then(() => {
        console.log('Database connected successfully');
      }).catch((error) => {
        console.error('Unable to connect to the database:', error);
        throw error;
      });
    }
    return DB.instance;
  }
}
