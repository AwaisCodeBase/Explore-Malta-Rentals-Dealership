import { timingSafeEqual } from "node:crypto";

function safeEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function isAuthorizedCronRequest(request: Request, secret: string): boolean {
  const expected = secret.trim();
  if (!expected) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? "";
  return safeEqual(bearer, expected) || safeEqual(headerSecret, expected);
}
