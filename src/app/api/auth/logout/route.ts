import { NextResponse } from 'next/server';
import { COOKIE_NAME, getSessionFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (session) {
      await createAuditLog({ action: 'USER_LOGOUT', entityType: 'User', entityId: session.id, userId: session.id });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function GET(request: Request) {
  const session = await import('@/lib/auth').then(m => m.getSessionFromRequest(request));
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: session });
}
