import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    // Delete chunks first (handled by Prisma cascade if setup, but let's be explicit just in case)
    await prisma.knowledgeChunk.deleteMany({
      where: { documentId: id }
    });

    await prisma.knowledgeDocument.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Knowledge DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
