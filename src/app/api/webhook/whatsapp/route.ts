import { NextResponse } from 'next/server';
import { getDb, assignRiderToOrder, sendWhatsAppMessage } from '@/lib/db';

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, ''); // Keep only digits
  return clean.length >= 10 ? clean.slice(-10) : clean; // Keep the last 10 digits
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check if the event is message upsert
    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ success: true, message: 'Unhandled event type: ' + body.event });
    }

    const data = body.data;
    const remoteJid = data?.key?.remoteJid || '';
    const fromMe = data?.key?.fromMe;

    // Ignore messages sent by the bot itself
    if (fromMe) {
      return NextResponse.json({ success: true, message: 'Message sent by self, ignored' });
    }

    // Extract message content safely
    let text = '';
    if (data?.message?.conversation) {
      text = data.message.conversation.trim();
    } else if (data?.message?.extendedTextMessage?.text) {
      text = data.message.extendedTextMessage.text.trim();
    }

    if (!text) {
      return NextResponse.json({ success: true, message: 'Empty message content, ignored' });
    }

    const cleanSenderPhone = remoteJid.split('@')[0];
    const normalizedSenderPhone = normalizePhone(cleanSenderPhone);
    const db = await getDb();

    // ----------------------------------------------------
    // CASE A: Rider Response ("1" = Accept, "2" = Reject)
    // ----------------------------------------------------
    if (text === '1' || text === '2') {
      // Find delivery boy with matching phone number
      const riders = await db.all('SELECT * FROM delivery_boys');
      const rider = riders.find((r: any) => normalizePhone(r.phone) === normalizedSenderPhone);

      if (!rider) {
        return NextResponse.json({ success: true, message: `Text '1' or '2' received, but sender ${cleanSenderPhone} is not a registered rider.` });
      }

      // Find active order assigned to this rider in 'confirmed' state
      const order = await db.get(
        "SELECT * FROM orders WHERE delivery_boy_id = ? AND status = 'confirmed' ORDER BY created_at ASC LIMIT 1",
        [rider.id]
      );

      if (!order) {
        return NextResponse.json({ success: true, message: `Rider ${rider.name} responded but has no active order waiting in 'confirmed' state.` });
      }

      if (text === '1') {
        // Rider Accepted:
        // 1. Update order status to 'assigned'
        await db.run("UPDATE orders SET status = 'assigned' WHERE id = ?", [order.id]);

        // 2. Set rider status to 'busy'
        await db.run("UPDATE delivery_boys SET status = 'busy' WHERE id = ?", [rider.id]);

        // 3. Notify Customer
        const customerText = `🛵 Good news! Your order *#${order.id}* is now assigned to our delivery partner *${rider.name}* (+91 ${rider.phone}). Your food will be dispatched shortly!`;
        await sendWhatsAppMessage(order.customer_phone, customerText);

        console.log(`Order #${order.id} accepted by rider ${rider.name}`);
        return NextResponse.json({ success: true, message: `Order #${order.id} accepted by rider ${rider.name}` });
      } else {
        // Rider Rejected:
        // 1. Append rider's ID to rejected riders list
        const currentRejected = order.rejected_riders || '';
        const newRejected = currentRejected ? `${currentRejected},${rider.id}` : `${rider.id}`;

        // 2. Clear delivery boy assignment
        await db.run(
          'UPDATE orders SET delivery_boy_id = NULL, rejected_riders = ? WHERE id = ?',
          [newRejected, order.id]
        );

        // 3. Re-run round robin assignment
        const nextRider = await assignRiderToOrder(order.id);
        
        console.log(`Order #${order.id} rejected by rider ${rider.name}. Reassigned to: ${nextRider ? nextRider.name : 'None available'}`);
        return NextResponse.json({ 
          success: true, 
          message: `Order #${order.id} rejected by rider ${rider.name}, reassigned successfully.` 
        });
      }
    }

    // ----------------------------------------------------
    // CASE A.5: Rider Delivery Confirmation ("delivered", "done")
    // ----------------------------------------------------
    const lowerText = text.toLowerCase();
    if (lowerText.includes('delivered') || lowerText.includes('done')) {
      // Find delivery boy with matching phone number
      const riders = await db.all('SELECT * FROM delivery_boys');
      const rider = riders.find((r: any) => normalizePhone(r.phone) === normalizedSenderPhone);

      if (rider) {
        // Find their active order
        const order = await db.get(
          "SELECT * FROM orders WHERE delivery_boy_id = ? AND status IN ('assigned', 'picked_up', 'out_for_delivery') ORDER BY created_at ASC LIMIT 1",
          [rider.id]
        );

        if (order) {
          // Mark order as delivered
          await db.run("UPDATE orders SET status = 'delivered' WHERE id = ?", [order.id]);
          // Mark rider as available
          await db.run("UPDATE delivery_boys SET status = 'available' WHERE id = ?", [rider.id]);

          // Send confirmation to driver
          await sendWhatsAppMessage(rider.phone, `✅ Awesome! Order #${order.id} has been marked as Delivered. You are now Available for new orders.`);

          // Send confirmation to customer
          const customerText = `🏁 *Delivered!* Your order *#${order.id}* has been delivered successfully. Thank you for dining with Swaad Rustam! ❤️`;
          await sendWhatsAppMessage(order.customer_phone, customerText);

          console.log(`Order #${order.id} marked as delivered by rider ${rider.name} via WhatsApp.`);
          return NextResponse.json({ success: true, message: `Order #${order.id} marked delivered by rider.` });
        }
      }
    }

    // ----------------------------------------------------
    // CASE B: Customer UTR Code Submission (12-digit number)
    // ----------------------------------------------------
    const utrRegex = /^\d{12}$/;
    if (utrRegex.test(text)) {
      // Find the last order placed by this phone number that is currently awaiting payment
      const orders = await db.all("SELECT * FROM orders WHERE status = 'pending_payment' ORDER BY created_at DESC");
      const matchedOrder = orders.find((o: any) => normalizePhone(o.customer_phone) === normalizedSenderPhone);

      if (!matchedOrder) {
        // Text back customer that no pending orders were found
        const errorMsg = `❌ *Swaad Rustam Bot*\n\nWe couldn't find any pending orders matching your phone number (+91 ${cleanSenderPhone}).\n\nIf you have already paid, please submit your UTR directly on the checkout screen or contact support at +91 99991 26201.`;
        await sendWhatsAppMessage(cleanSenderPhone, errorMsg);
        
        return NextResponse.json({ success: true, message: `UTR received but no pending payment order found for ${cleanSenderPhone}.` });
      }

      // Update order status to confirmed and save UTR
      await db.run(
        "UPDATE orders SET status = 'confirmed', utr_number = ? WHERE id = ?",
        [text, matchedOrder.id]
      );

      // Notify customer of payment confirmation
      const confirmMsg = `✅ *Payment received successfully.*\nYour order *#${matchedOrder.id}* (Amount: ₹${matchedOrder.total_amount.toFixed(2)}) has been confirmed and is being prepared in our kitchen! 👨‍🍳\n\n📍 *Track your order live:*\nhttp://localhost:3000/track/${matchedOrder.id}`;
      await sendWhatsAppMessage(matchedOrder.customer_phone, confirmMsg);

      // Auto-assign rider in round-robin fashion
      const assignedRider = await assignRiderToOrder(matchedOrder.id);

      console.log(`Order #${matchedOrder.id} confirmed via WhatsApp UTR submission. Rider: ${assignedRider ? assignedRider.name : 'None available'}`);
      return NextResponse.json({
        success: true,
        message: `Order #${matchedOrder.id} confirmed via WhatsApp UTR. Rider: ${assignedRider ? assignedRider.name : 'None'}`
      });
    }

    // General messages that do not match the rider reply or UTR submission are ignored
    return NextResponse.json({ success: true, message: 'Message ignored (no matching actions)' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process WhatsApp webhook', details: error.message },
      { status: 500 }
    );
  }
}
