import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function signRefreshToken(payload: { sub: string }): string {
  // Include a random jti so two tokens issued for the same user within the
  // same second (e.g. concurrent refresh calls) never collide. Without this,
  // jwt.sign() is deterministic at 1-second resolution and produces an
  // identical token, which crashes the tokenHash unique constraint.
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Parses JWT_REFRESH_EXPIRES_IN-style strings ("7d", "15m", ...) into
 * milliseconds. Shared by the DB expiry timestamp (auth.service) and the
 * refresh-token cookie's maxAge (auth.controller) so both go stale at
 * exactly the same moment. Defaults to 7 days if the string can't be parsed.
 */
export function refreshExpiresInMs(): number {
  const match = env.jwt.refreshExpiresIn.match(/^(\d+)([smhd])$/);
  const amount = match ? parseInt(match[1], 10) : 7;
  const unit = match ? match[2] : "d";
  const msPerUnit: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * (msPerUnit[unit] ?? 86400000);
}