import { NextResponse } from 'next/server';
import { getDb, assignRiderToOrder, sendWhatsAppMessage } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, utr_number, amount } = body;

    if (!order_id && !utr_number) {
      return NextResponse.json(
        { error: 'Either order_id or utr_number is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    let order: any = null;

    if (order_id) {
      order = await db.get('SELECT * FROM orders WHERE id = ?', [parseInt(order_id, 10)]);
    } else if (utr_number) {
      // Find order by UTR number
      order = await db.get('SELECT * FROM orders WHERE utr_number = ?', [utr_number.trim()]);
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If order is already confirmed, assigned, or further, return success but don't re-run assignment
    const alreadyProcessed = ['confirmed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered'].includes(order.status);
    if (alreadyProcessed) {
      return NextResponse.json({
        success: true,
        message: 'Order already confirmed or processed',
        orderId: order.id,
        status: order.status
      });
    }

    // Verify amount if provided (optional check)
    if (amount && Math.abs(order.total_amount - parseFloat(amount)) > 0.01) {
      console.warn(`Amount mismatch for Order #${order.id}. Order total: ${order.total_amount}, Webhook amount: ${amount}`);
    }

    const finalUtr = utr_number || order.utr_number || '';

    // Update order status to confirmed and save UTR
    await db.run(
      "UPDATE orders SET status = 'confirmed', utr_number = ? WHERE id = ?",
      [finalUtr, order.id]
    );

    // Send payment confirmation message directly to the customer via Evolution API
    const confirmMsg = `✅ *Payment received successfully.*\nYour order *#${order.id}* (Amount: ₹${order.total_amount.toFixed(2)}) has been confirmed and is being prepared in our kitchen! 👨‍🍳\n\n📍 *Track your order live:*\nhttp://localhost:3000/track/${order.id}`;
    await sendWhatsAppMessage(order.customer_phone, confirmMsg);

    // Auto-assign rider in round-robin fashion
    const assignedRider = await assignRiderToOrder(order.id);

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully and order preparation initiated',
      orderId: order.id,
      assignedRider: assignedRider ? {
        id: assignedRider.id,
        name: assignedRider.name,
        phone: assignedRider.phone
      } : 'No riders available'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process payment confirmation', details: error.message },
      { status: 500 }
    );
  }
}
