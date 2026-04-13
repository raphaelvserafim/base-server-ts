import {
  DB,
  UserNotificationsPushEntity,
  UserProvidersEntity,
  UsersEntity
} from "@app/database/index.js";

const db = DB.getInstance();

UsersEntity.initialize(db);
UserProvidersEntity.initialize(db);
UserNotificationsPushEntity.initialize(db);
