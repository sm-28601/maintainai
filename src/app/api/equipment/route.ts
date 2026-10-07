import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { equipmentId: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: {
          issues: {
            where: { status: { not: 'CLOSED' } },
            select: { id: true, status: true, priority: true },
          },
          _count: { select: { maintenanceRecords: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.equipment.count({ where }),
    ]);

    // Get last maintenance date for each equipment
    const withLastMaintenance = await Promise.all(
      items.map(async eq => {
        const last = await prisma.maintenanceRecord.findFirst({
          where: { equipmentId: eq.id },
          orderBy: { performedAt: 'desc' },
          select: { performedAt: true },
        });
        return { ...eq, lastMaintenanceAt: last?.performedAt };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        items: withLastMaintenance,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('[Equipment GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { equipmentId, type, model, location, manufacturer, description } = body;

    if (!equipmentId || !type || !model || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await prisma.equipment.findUnique({ where: { equipmentId } });
    if (existing) return NextResponse.json({ error: 'Equipment ID already exists' }, { status: 409 });

    const equipment = await prisma.equipment.create({
      data: { equipmentId, type, model, location, manufacturer, description },
    });

    await createAuditLog({
      action: 'EQUIPMENT_CREATED',
      entityType: 'Equipment',
      entityId: equipment.id,
      userId: session.id,
      details: { equipmentId, type, model },
    });

    return NextResponse.json({ success: true, data: equipment }, { status: 201 });
  } catch (error) {
    console.error('[Equipment POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
