import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

type Params = Promise<{ id: string }>;

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
    const { name, phone, status } = body;

    const db = await getDb();

    let query = 'UPDATE delivery_boys SET ';
    const queryParams: any[] = [];
    const fieldsToUpdate: string[] = [];

    if (name !== undefined) {
      fieldsToUpdate.push('name = ?');
      queryParams.push(name.trim());
    }
    if (phone !== undefined) {
      fieldsToUpdate.push('phone = ?');
      queryParams.push(phone.trim());
    }
    if (status !== undefined) {
      fieldsToUpdate.push('status = ?');
      queryParams.push(status);
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    query += fieldsToUpdate.join(', ') + ' WHERE id = ?';
    queryParams.push(parseInt(id, 10));

    const result = await db.run(query, queryParams);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery partner updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update delivery partner', details: error.message },
      { status: 500 }
    );
  }
}

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
    const result = await db.run('DELETE FROM delivery_boys WHERE id = ?', [
      parseInt(id, 10)
    ]);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery partner deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete delivery partner', details: error.message },
      { status: 500 }
    );
  }
}
