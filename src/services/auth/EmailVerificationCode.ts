import { getRedis } from "@app/database/redis.js";
 
const EMAIL_CODE_PREFIX = 'email_verification:';
const EMAIL_CODE_TTL = 3600;

export class EmailVerificationCodeService {
  static generateCode(): string {
    const code = Math.floor(1000 + Math.random() * 9000);
    return String(code);
  }

  static async storeCode(userId: number, code: string): Promise<void> {
    const redis = getRedis();
    await redis.set(`${EMAIL_CODE_PREFIX}${userId}`, code, 'EX', EMAIL_CODE_TTL);
  }

  static async getCode(userId: number): Promise<string | null> {
    const redis = getRedis();
    return await redis.get(`${EMAIL_CODE_PREFIX}${userId}`);
  }

  static async verifyCode(userId: number, code: string): Promise<boolean> {
    const storedCode = await this.getCode(userId);
    if (!storedCode) return false;
    return storedCode === code;
  }

  static async deleteCode(userId: number): Promise<void> {
    const redis = getRedis();
    await redis.del(`${EMAIL_CODE_PREFIX}${userId}`);
  }

  static async getTTL(userId: number): Promise<number> {
    const redis = getRedis();
    return await redis.ttl(`${EMAIL_CODE_PREFIX}${userId}`);
  }
}
