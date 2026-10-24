import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = { sub: string; role: "STUDENT" | "MENTOR" | "ADMIN" };

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "devsubmit",
    audience: "devsubmit-api",
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: "devsubmit",
    audience: "devsubmit-api",
  });
  if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
    throw new Error("Malformed token payload");
  }
  return {
    sub: String(decoded.sub),
    role: decoded.role as JwtPayload["role"],
  };
}
