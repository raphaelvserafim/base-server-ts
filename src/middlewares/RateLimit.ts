import { Middleware, Req, Res, Next } from "@tsed/common";
import { checkRateLimit } from "@app/services/RateLimiter.js";

function getIp(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// ─── AuthRateLimit ────────────────────────────────────────────────────────────
// Max 10 attempts per IP within 15 minutes.
// Apply on: login, register, password reset, confirm-email.

@Middleware()
export class AuthRateLimit {
  private static readonly MAX = 10;
  private static readonly WINDOW_MS = 900_000; // 15 min

  async use(@Req() req: Req, @Res() res: Res, @Next() next: Next) {
    const key = `rate:auth:${getIp(req)}`;
    const { allowed, retryAfterMs } = await checkRateLimit(key, AuthRateLimit.MAX, AuthRateLimit.WINDOW_MS);

    if (!allowed) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return (res as any)
        .status(429)
        .set("Retry-After", String(retryAfterSec))
        .json({ status: 429, message: "Muitas tentativas. Tente novamente em 15 minutos." });
    }

    next();
  }
}

// ─── GlobalRateLimit ─────────────────────────────────────────────────────────
// Max 120 requests per IP per minute.
// Apply on: any public or sensitive endpoint.

@Middleware()
export class GlobalRateLimit {
  private static readonly MAX = 120;
  private static readonly WINDOW_MS = 60_000; // 1 min

  async use(@Req() req: Req, @Res() res: Res, @Next() next: Next) {
    const key = `rate:api:${getIp(req)}`;
    const { allowed, retryAfterMs } = await checkRateLimit(key, GlobalRateLimit.MAX, GlobalRateLimit.WINDOW_MS);

    if (!allowed) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return (res as any)
        .status(429)
        .set("Retry-After", String(retryAfterSec))
        .json({ status: 429, message: "Muitas requisições. Tente novamente em instantes." });
    }

    next();
  }
}
