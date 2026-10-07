import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // id can be either the cuid or the equipmentId
    const equipment = await prisma.equipment.findFirst({
      where: { OR: [{ id }, { equipmentId: id }] },
      include: {
        issues: {
          include: {
            _count: { select: { workOrders: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        maintenanceRecords: {
          orderBy: { performedAt: 'desc' },
        },
        sensorReadings: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
        workOrders: {
          orderBy: { createdAt: 'desc' },
        },
        events: {
          orderBy: { eventDate: 'desc' },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    console.error('[Equipment/:id GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { status, location, description, notes } = body;

    const equipment = await prisma.equipment.update({
      where: { id },
      data: { status, location, description },
    });

    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
