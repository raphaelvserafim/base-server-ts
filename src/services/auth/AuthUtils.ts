import bcrypt from 'bcrypt';

export class AuthUtils {
  static async encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, await bcrypt.genSalt(10));
  }

  static async comparePassword(plain: string, hash: string): Promise<boolean> {
    if(!plain || !hash) {
      throw new Error("Invalid password or hash");
    }
    return bcrypt.compare(plain, hash);
  }
}