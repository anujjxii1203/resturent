import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

// GET all menu items
export async function GET() {
  try {
    const db = await getDb();
    const menuItems = await db.all('SELECT * FROM menu_items ORDER BY category, name');
    return NextResponse.json({ success: true, data: menuItems });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch menu items', details: error.message },
      { status: 500 }
    );
  }
}

// POST create or update a menu item (Admin only)
export async function POST(request: Request) {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, price, category, image_url, available } = body;

    // Validate price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      );
    }

    const isAvailable = available === false || available === 0 ? 0 : 1;

    if (id) {
      // Update existing item
      const db = await getDb();
      const result = await db.run(
        `UPDATE menu_items 
         SET name = ?, description = ?, price = ?, category = ?, image_url = ?, available = ? 
         WHERE id = ?`,
        [name, description, parsedPrice, category, image_url, isAvailable, id]
      );

      if (result.changes === 0) {
        return NextResponse.json(
          { error: 'Menu item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Menu item updated successfully',
      });
    } else {
      // Create new item
      if (!name || !description || !category || !image_url) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        );
      }

      const db = await getDb();
      const result = await db.run(
        `INSERT INTO menu_items (name, description, price, category, image_url, available) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, description, parsedPrice, category, image_url, isAvailable]
      );

      return NextResponse.json({
        success: true,
        message: 'Menu item created successfully',
        id: result.lastID,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to save menu item', details: error.message },
      { status: 500 }
    );
  }
}
