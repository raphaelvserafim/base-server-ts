import { Options } from "sequelize";
import { getEnv } from "@app/config/envs";

export interface IDbConfig {
  user: string;
  password: string;
  database: string;
  options: Options;
}

export const dbConfig: IDbConfig = {
  user: getEnv().DB_USER,
  password: getEnv().DB_PASS,
  database: getEnv().DB_NAME,
  options: {
    host: getEnv().DB_HOST,
    dialect: "mysql",
    timezone: '-04:00',
    logging: true,
    port: getEnv().DB_PORT,
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
  },
};