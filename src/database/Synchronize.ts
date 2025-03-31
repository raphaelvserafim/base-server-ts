import { $log } from "@tsed/common";
import { Users, NewPasswords } from "@app/database";

export async function synchronizeDB() {
  try {

    await Users.sync({ alter: true });

    await NewPasswords.sync({ alter: true });

    $log.info("Done synchronize DB")
  } catch (error) {
    $log.error(error.message)
  }
}