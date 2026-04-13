import { config } from "@app/config/index.js";  
import { IDbConfig } from "@app/types/index.js";


export const dbConfig: IDbConfig = {
  ...config.db,
};
