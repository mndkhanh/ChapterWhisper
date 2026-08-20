import type { CookieOptions } from 'express';
import { getJwtExpiresIn } from '../config.js';

export const SESSION_COOKIE = 'cw_session';

/**
 * `JWT_EXPIRES_IN` is a jsonwebtoken duration string ('7d', '12h', '30m', '45s')
 * or a bare number of seconds. The cookie needs it in milliseconds so that the
 * browser drops the cookie at the same moment the token stops verifying —
 * otherwise the client believes it is signed in and every request 401s.
 */
export function sessionMaxAgeMs(): number {
  const raw = getJwtExpiresIn().trim();
  const match = /^(\d+)\s*([smhd])?$/i.exec(raw);
  if (!match) {
    throw new Error(`JWT_EXPIRES_IN is not a duration this app understands: "${raw}"`);
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  const perUnit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

  return amount * perUnit[unit as keyof typeof perUnit];
}

export function sessionCookieOptions(): CookieOptions {
  return {
    // The whole point: JavaScript cannot read it, so an XSS bug cannot steal the session.
    httpOnly: true,
    // 'lax' is right for a same-origin app: the request carries the cookie on normal
    // navigation but not on a cross-site POST, which is the CSRF vector that matters here.
    sameSite: 'lax',
    // Dev runs over plain http on localhost; requiring TLS there would drop the cookie.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAgeMs(),
  };
}
