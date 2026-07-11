import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== 'number') {
      return NextResponse.json({ error: 'approved status required' }, { status: 400 });
    }

    const db = await getDb();
    await db.run(
      'UPDATE reviews SET approved = ? WHERE id = ?',
      [approved, resolvedParams.id]
    );

    return NextResponse.json({ success: true, message: 'Review updated successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update review', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const db = await getDb();
    await db.run('DELETE FROM reviews WHERE id = ?', [resolvedParams.id]);

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete review', details: error.message },
      { status: 500 }
    );
  }
}
