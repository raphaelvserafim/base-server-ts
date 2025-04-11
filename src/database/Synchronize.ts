import { $log } from "@tsed/common";
import { Users, NewPasswords, UserCredentials, UserProviders } from "@app/database";

export async function synchronizeDB() {
  try {
    await Users.sync({ alter: true });

    await NewPasswords.sync({ alter: true });

    await UserCredentials.sync({ alter: true });
    await UserProviders.sync({ alter: true });

    $log.info("Done synchronize DB")
  } catch (error) {
    $log.error(error.message)
  }
}

synchronizeDB();