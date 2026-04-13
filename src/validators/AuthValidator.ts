import * as EmailValidator from 'email-validator';
import { throwError } from "@app/utils/index.js";
import { LoginSchema, RegisterSchema } from "@app/schemas/index.js";

export class AuthValidator {

  static validateLogin(data: LoginSchema) {
    if (!data.email) throwError(400, "enter email first");
    if (!EmailValidator.validate(data.email)) throwError(400, "invalid email");
    if (!data.password) throwError(400, "enter password first");
  }

  static validateRegister(data: RegisterSchema) {
    if (!data.name) throwError(400, "enter name first");
    if (!data.email) throwError(400, "enter email first");
    if (!EmailValidator.validate(data.email)) throwError(400, "invalid email");
    if (!data.password) throwError(400, "enter password first");
    if (!data.recaptchaToken) throwError(400, "enter reCAPTCHA token first");
  }


  static isStrongPassword(password: string) {
    // const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,}$/;
    return password.length > 4;//(password);
  }
}