import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all reviews (or only approved ones based on auth/query)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdminReq = searchParams.get('admin') === 'true';

    const db = await getDb();
    
    let reviews;
    if (isAdminReq) {
      // Admin sees all reviews
      reviews = await db.all('SELECT * FROM reviews ORDER BY date DESC');
    } else {
      // Public only sees approved reviews
      reviews = await db.all('SELECT * FROM reviews WHERE approved = 1 ORDER BY date DESC');
    }

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}

// POST create a new review
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { author, rating, comment } = body;

    if (!author || !rating || !comment) {
      return NextResponse.json(
        { error: 'All fields (author, rating, comment) are required' },
        { status: 400 }
      );
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const date = new Date().toISOString();

    const db = await getDb();
    const result = await db.run(
      `INSERT INTO reviews (author, rating, comment, date, approved) VALUES (?, ?, ?, ?, 0)`,
      [author.trim(), parsedRating, comment.trim(), date]
    );

    return NextResponse.json({
      success: true,
      message: 'Review submitted for moderation',
      id: result.lastID,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to submit review', details: error.message },
      { status: 500 }
    );
  }
}
