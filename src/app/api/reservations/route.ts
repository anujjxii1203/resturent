import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

// GET all reservations (Admin only)
export async function GET() {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const reservations = await db.all(
      'SELECT * FROM reservations ORDER BY date DESC, time DESC'
    );
    return NextResponse.json({ success: true, data: reservations });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch reservations', details: error.message },
      { status: 500 }
    );
  }
}

// POST create a new reservation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, date, time, guests } = body;

    // Validate inputs
    if (!name || !email || !phone || !date || !time || !guests) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const parsedGuests = parseInt(guests, 10);
    if (isNaN(parsedGuests) || parsedGuests <= 0) {
      return NextResponse.json(
        { error: 'Invalid number of guests' },
        { status: 400 }
      );
    }

    // Insert into DB
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO reservations (name, email, phone, date, time, guests, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [name, email, phone, date, time, parsedGuests]
    );

    return NextResponse.json({
      success: true,
      message: 'Reservation request submitted successfully',
      id: result.lastID,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process reservation', details: error.message },
      { status: 500 }
    );
  }
}
