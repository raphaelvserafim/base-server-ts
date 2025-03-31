import { Property } from "@tsed/schema";

export class Login {
  @Property()
  email: string;
  @Property()
  password: string;
}
export class Register {
  @Property()
  name: string;
  @Property()
  email: string;
  @Property()
  password: string;
}


export class UpdatedPassword {
  @Property()
  code: string;
  @Property()
  password: string;
}
