// Auth utilities using JWT tokens stored in HTTP-only cookies
// No external auth library dependency — uses jose for JWT operations

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'maintainai-dev-secret'
);
const COOKIE_NAME = 'maintainai-auth';
const TOKEN_EXPIRY = '7d';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'VIEWER';
}

export async function createToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export function requireRole(session: SessionUser, ...roles: SessionUser['role'][]): void {
  if (!roles.includes(session.role)) {
    throw new Error(`Forbidden: requires role ${roles.join(' or ')}`);
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export async function getSessionFromRequest(request: Request): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
