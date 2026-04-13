import { Example, Property } from "@tsed/schema";

export class LoginSchema {
  @Property()
  @Example("")
  email!: string;
  @Property()
  @Example("")
  password!: string;
}
export class RegisterSchema {
  @Property()
  @Example("")
  name!: string;

  @Property()
  @Example("")
  email!: string;

  @Property()
  @Example("")
  recaptchaToken!: string;

  @Property()
  @Example("")
  phone?: string;


  @Property()
  @Example("")
  password!: string;
}


export class UpdatedPasswordSchema {
  @Property()
  @Example("")
  code!: string;
  @Property()
  @Example("")
  password!: string;
}

export class GoogleCredentialSchema {
  @Property()
  @Example("")
  credential!: string;

  @Property()
  @Example("")
  clientId!: string;


}
