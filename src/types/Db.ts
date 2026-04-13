import { Options } from "sequelize";

export interface IDbConfig {
  user: string;
  password: string;
  database: string;
  options: Options;
};