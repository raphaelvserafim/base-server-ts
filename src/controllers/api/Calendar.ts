import { AuthService } from "@app/services";
import { BodyParams, Controller, Inject, Post, QueryParams, Res } from "@tsed/common";
import { Description, Name, Patch, Put, Security, Summary } from "@tsed/schema";

@Controller('/calendar')
@Name("Calendar")
@Description("Handles calendar-related operations.")
@Security("auth")

export class CalendarController {

  @Inject() private auth: AuthService;


}
