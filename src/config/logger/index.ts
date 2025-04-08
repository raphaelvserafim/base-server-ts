import { $log } from "@tsed/common";

$log.appenders.set("stdout", {
  type: "stdout",
  levels: ["info", "debug"],
  layout: {
    type: "json"
  }
});