import { Sequelize } from "sequelize";
import { getEnv } from '@app/config/env';
import { isProduction } from "@app/config/envs";

export class DB {
  private static instance: Sequelize;

  private constructor() { }

  static getInstance(): Sequelize {
    if (!DB.instance) {
      const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = getEnv();
      DB.instance = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
        host: DB_HOST,
        dialect: "mysql",
        timezone: '-04:00',
        logging: isProduction,
        port: DB_PORT,
        define: {
          underscored: true,
          freezeTableName: true,
        },
        pool: {
          max: 100,
          min: 1,
          acquire: 30000,
          idle: 10000,
        },
        retry: {
          max: 3,
        }
      });

      DB.instance.authenticate()
        .then(() => console.log('✅ Database connected successfully'))
        .catch((error) => {
          console.error('❌ Unable to connect to the database');
        });
    }
    return DB.instance;
  }
}