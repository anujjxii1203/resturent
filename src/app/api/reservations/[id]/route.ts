import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

type Params = Promise<{ id: string }>;

// PATCH to update reservation status (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body; // 'approved' | 'cancelled' | 'pending'

    if (!status || !['approved', 'cancelled', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.run(
      'UPDATE reservations SET status = ? WHERE id = ?',
      [status, parseInt(id, 10)]
    );

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Reservation status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update reservation', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE a reservation (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    const result = await db.run('DELETE FROM reservations WHERE id = ?', [
      parseInt(id, 10),
    ]);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reservation deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete reservation', details: error.message },
      { status: 500 }
    );
  }
}
