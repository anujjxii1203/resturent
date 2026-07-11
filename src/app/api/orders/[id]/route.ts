import { NextResponse } from 'next/server';
import { getDb, assignRiderToOrder, sendWhatsAppMessage } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

type Params = Promise<{ id: string }>;

// GET a specific order (Public but read-only tracking)
export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    // Join with delivery_boys to get rider name and phone if assigned
    const order = await db.get(`
      SELECT o.*, d.name as delivery_boy_name, d.phone as delivery_boy_phone 
      FROM orders o 
      LEFT JOIN delivery_boys d ON o.delivery_boy_id = d.id 
      WHERE o.id = ?
    `, [parseInt(id, 10)]);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Hide sensitive info if needed, but since it's an order tracking link, we can expose basic details
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH to update order status or assign delivery boy (Admin only)
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
    const { status, delivery_boy_id } = body;

    const db = await getDb();
    
    // Retrieve the existing order first to compare status changes and check associated riders
    const orderIdNum = parseInt(id, 10);
    const existingOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderIdNum]);
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Build the dynamic update query
    let query = 'UPDATE orders SET ';
    const queryParams: any[] = [];
    const fieldsToUpdate: string[] = [];

    if (status !== undefined) {
      fieldsToUpdate.push('status = ?');
      queryParams.push(status);
    }

    if (delivery_boy_id !== undefined) {
      fieldsToUpdate.push('delivery_boy_id = ?');
      queryParams.push(delivery_boy_id === null ? null : parseInt(delivery_boy_id, 10));
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    query += fieldsToUpdate.join(', ') + ' WHERE id = ?';
    queryParams.push(orderIdNum);

    await db.run(query, queryParams);

    // Free the old rider if order is now cancelled or delivered
    if (status === 'delivered' || status === 'cancelled') {
      const riderId = delivery_boy_id !== undefined ? delivery_boy_id : existingOrder.delivery_boy_id;
      if (riderId) {
        await db.run("UPDATE delivery_boys SET status = 'available' WHERE id = ?", [riderId]);
      }
    }

    // If manual reassignment happens:
    // 1. If rider changed, free the previous rider (set available) and set new rider to busy
    if (delivery_boy_id !== undefined && delivery_boy_id !== existingOrder.delivery_boy_id) {
      if (existingOrder.delivery_boy_id) {
        await db.run("UPDATE delivery_boys SET status = 'available' WHERE id = ?", [existingOrder.delivery_boy_id]);
      }
      if (delivery_boy_id) {
        await db.run("UPDATE delivery_boys SET status = 'busy' WHERE id = ?", [delivery_boy_id]);
        
        // Also automatically transition order status to 'assigned' when admin manually sets rider
        if (!status || status === 'confirmed' || status === 'pending_payment') {
          await db.run("UPDATE orders SET status = 'assigned' WHERE id = ?", [orderIdNum]);
        }
      }
    }

    // Fetch updated order to get exact current state for triggering webhooks
    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderIdNum]);
    const itemsParsed = JSON.parse(updatedOrder.order_items || '[]');

    // Trigger n8n Webhooks depending on what was updated
    if (status) {
      if (status === 'confirmed' && existingOrder.status !== 'confirmed') {
        // Direct WhatsApp payment confirmation to customer
        const confirmText = `✅ *Payment received successfully.*\nYour order *#${updatedOrder.id}* (Amount: ₹${updatedOrder.total_amount.toFixed(2)}) has been confirmed and is being prepared in our kitchen! 👨‍🍳`;
        await sendWhatsAppMessage(updatedOrder.customer_phone, confirmText);
        
        // Trigger automatic round-robin rider assignment (calls sendWhatsAppMessage internally)
        await assignRiderToOrder(updatedOrder.id);
      } else if (status === 'assigned' && updatedOrder.delivery_boy_id) {
        const boy = await db.get('SELECT * FROM delivery_boys WHERE id = ?', [updatedOrder.delivery_boy_id]);
        if (boy) {
          const assignText = `🛵 Good news! Your order *#${updatedOrder.id}* is now assigned to our delivery partner *${boy.name}* (+91 ${boy.phone}). Your food will be dispatched shortly!`;
          await sendWhatsAppMessage(updatedOrder.customer_phone, assignText);
        }
      } else {
        // Handle general status updates to customer
        let statusText = '';
        if (status === 'picked_up') {
          statusText = `🍕 Your order *#${updatedOrder.id}* has been picked up from our kitchen and is being packaged for delivery!`;
        } else if (status === 'out_for_delivery') {
          const boy = updatedOrder.delivery_boy_id ? await db.get('SELECT * FROM delivery_boys WHERE id = ?', [updatedOrder.delivery_boy_id]) : null;
          statusText = `🛵 Your order *#${updatedOrder.id}* is now *Out for Delivery*! ${boy ? `Our delivery agent *${boy.name}* (+91 ${boy.phone}) will reach you shortly.` : 'It will reach you shortly.'} Enjoy your meal!`;
        } else if (status === 'delivered') {
          statusText = `🏁 *Delivered!* Your order *#${updatedOrder.id}* has been delivered successfully. Thank you for dining with Swaad Rustam! ❤️`;
        } else if (status === 'cancelled') {
          statusText = `❌ Your order *#${updatedOrder.id}* has been *Cancelled*. If you did not request this, please contact our support.`;
        }

        if (statusText) {
          await sendWhatsAppMessage(updatedOrder.customer_phone, statusText);
        }
      }
    } else if (delivery_boy_id !== undefined && delivery_boy_id !== null) {
      // If only rider was updated (manually reassigned) and no status was passed
      const boy = await db.get('SELECT * FROM delivery_boys WHERE id = ?', [delivery_boy_id]);
      if (boy) {
        // Notify customer
        const reassignText = `🛵 Your order *#${updatedOrder.id}* has been reassigned to *${boy.name}* (+91 ${boy.phone}).`;
        await sendWhatsAppMessage(updatedOrder.customer_phone, reassignText);

        // Notify new rider
        const riderText = `🚚 *New Delivery Assigned (Manual)*\n\nOrder ID: #${updatedOrder.id}\nPickup: Swaad Rustam & Biryani\nCustomer Address: ${updatedOrder.delivery_address}\nTotal Bill: ₹${updatedOrder.total_amount.toFixed(2)}`;
        await sendWhatsAppMessage(boy.phone, riderText);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE an order (Admin only)
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
    const result = await db.run('DELETE FROM orders WHERE id = ?', [
      parseInt(id, 10),
    ]);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    );
  }
}
