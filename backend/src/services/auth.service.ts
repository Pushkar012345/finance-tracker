import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import { DEFAULT_CATEGORIES } from "../constants/defaultCategories";
import { SignupInput, LoginInput } from "../validators/auth.validator";
import { env } from "../config/env";

function refreshExpiryDate(): Date {
  // Mirrors JWT_REFRESH_EXPIRES_IN so the DB record and the token itself
  // go stale at the same time. Defaults to 7 days if parsing fails.
  const match = env.jwt.refreshExpiresIn.match(/^(\d+)([smhd])$/);
  const amount = match ? parseInt(match[1], 10) : 7;
  const unit = match ? match[2] : "d";
  const msPerUnit: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + amount * (msPerUnit[unit] ?? 86400000));
}

async function issueTokenPair(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = signRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken };
}

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      baseCurrency: input.baseCurrency ?? "INR",
      categories: {
        create: DEFAULT_CATEGORIES.map((c) => ({
          name: c.name,
          type: c.type,
          icon: c.icon,
        })),
      },
    },
  });

  const tokens = await issueTokenPair(user.id, user.email);

  return {
    user: { id: user.id, name: user.name, email: user.email, baseCurrency: user.baseCurrency },
    ...tokens,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError("Incorrect email or password.", 401);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError("Incorrect email or password.", 401);
  }

  const tokens = await issueTokenPair(user.id, user.email);

  return {
    user: { id: user.id, name: user.name, email: user.email, baseCurrency: user.baseCurrency },
    ...tokens,
  };
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Refresh token expired or invalid. Sign in again.", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token expired or invalid. Sign in again.", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError("Account no longer exists.", 401);
  }

  // Rotate: revoke the used token and issue a brand new pair. Limits the
  // damage if a refresh token is ever stolen — it only works once.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokenPair(user.id, user.email);

  return {
    user: { id: user.id, name: user.name, email: user.email, baseCurrency: user.baseCurrency },
    ...tokens,
  };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}