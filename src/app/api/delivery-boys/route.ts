import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const drivers = await db.all('SELECT * FROM delivery_boys ORDER BY name ASC');
    return NextResponse.json({ success: true, data: drivers });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch delivery agents', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, status } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.run(
      'INSERT INTO delivery_boys (name, phone, status, last_assigned_at) VALUES (?, ?, ?, NULL)',
      [name.trim(), phone.trim(), status || 'available']
    );

    return NextResponse.json({
      success: true,
      message: 'Delivery partner added successfully',
      id: result.lastID
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add delivery partner', details: error.message },
      { status: 500 }
    );
  }
}
