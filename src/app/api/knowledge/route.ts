import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const documents = await prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { chunks: true } },
      },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('[Knowledge GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Handle multipart form data for file upload (simplified for mock prototype)
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const equipmentType = formData.get('equipmentType') as string;
    const docType = formData.get('docType') as string;

    if (!file || !name || !docType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Since we don't have a real file store or pdf-parse set up properly for this simplified env,
    // we just create a mock document entry and mark it as indexed.
    
    const doc = await prisma.knowledgeDocument.create({
      data: {
        name,
        equipmentType: equipmentType ? (equipmentType as any) : null,
        docType: docType as any,
        filename: file.name,
        fileSize: file.size,
        status: 'INDEXED',
        pageCount: 1,
      },
    });

    // Create a mock chunk
    await prisma.knowledgeChunk.create({
      data: {
        documentId: doc.id,
        text: `This is a mock extracted chunk from the uploaded file: ${file.name}. It was processed automatically.`,
        chunkIndex: 0,
      }
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    console.error('[Knowledge POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
