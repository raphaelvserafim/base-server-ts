import { $log } from "@tsed/common";
import {
  UserNotificationsPushEntity,
  UserProvidersEntity,
  UsersEntity,
} from "@app/database/index.js";

export async function migrate() {
  try {
    $log.info("Starting database synchronization...");
    const models = [
      UsersEntity,
      UserProvidersEntity,
      UserNotificationsPushEntity,
    ];

    for (const model of models) {
      try {
        await model.sync({ alter: true });
        $log.info(`✓ ${model.name} synced`);
      } catch (error) {
        $log.warn(`⚠ ${model.name} failed: ${JSON.stringify(error)}`);
      }
    }

    $log.info("✅ Database synchronization completed!");
  } catch (error) {
    $log.error("❌ Sync error:", JSON.stringify(error));
    throw error;
  }
}

migrate().finally(() => process.exit(0));
