import { NextResponse } from 'next/server';
import { getDb, assignRiderToOrder, sendWhatsAppMessage } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

// GET all orders (Admin only)
export async function GET() {
  try {
    const authenticated = await isAdmin();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const orders = await db.all(`
      SELECT o.*, d.name as delivery_boy_name, d.phone as delivery_boy_phone 
      FROM orders o 
      LEFT JOIN delivery_boys d ON o.delivery_boy_id = d.id 
      ORDER BY o.created_at DESC
    `);

    // Parse order_items from stringified JSON back to array
    const parsedOrders = orders.map((order: any) => ({
      ...order,
      order_items: JSON.parse(order.order_items || '[]'),
    }));

    return NextResponse.json({ success: true, data: parsedOrders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}



// POST create a new order (Customer checkout)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      delivery_address,
      special_notes,
      order_items,
      total_amount,
    } = body;

    // Validate required fields
    if (!customer_name || !customer_phone || !delivery_address || !order_items || !total_amount) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    // Insert order into PostgreSQL (status defaults to 'pending_payment')
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO orders (customer_name, customer_phone, delivery_address, special_notes, order_items, total_amount, status, payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'cod')`,
      [
        customer_name,
        customer_phone,
        delivery_address,
        special_notes || '',
        JSON.stringify(order_items),
        parseFloat(total_amount),
      ]
    );

    const orderId = result.lastID;

    // Send confirmation message to customer
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const confirmMsg = `✅ *Order Placed Successfully.*\nYour order *#${orderId}* (Amount: ₹${parseFloat(total_amount).toFixed(2)}) has been confirmed as Cash on Delivery and is being prepared in our kitchen! 👨‍🍳\n\n📍 *Track your order live:*\n${siteUrl}/track/${orderId}`;
    await sendWhatsAppMessage(customer_phone, confirmMsg);

    // Auto-assign rider
    await assignRiderToOrder(orderId);

    return NextResponse.json({
      success: true,
      message: 'Order created',
      orderId
    });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
