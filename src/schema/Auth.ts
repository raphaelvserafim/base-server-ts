import { Example, Property } from "@tsed/schema";

export class Login {
  @Property()
  @Example("")
  email: string;
  @Property()
  @Example("")
  password: string;
}
export class Register {
  @Property()
  @Example("")
  name: string;

  @Property()
  @Example("")
  email: string;
  @Property()
  @Example("")
  password: string;
}


export class UpdatedPassword {
  @Property()
  @Example("")
  code: string;
  @Property()
  @Example("")
  password: string;
}

export class GoogleCredential {
  @Property()
  @Example("")
  credential: string;

  @Property()
  @Example("")
  clientId: string;


}
