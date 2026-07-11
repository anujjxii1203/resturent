import { NextResponse } from 'next/server';
import { getDb, assignRiderToOrder, sendWhatsAppMessage } from '@/lib/db';
import { verifyPhonePeCallbackSignature } from '@/lib/phonepe';

export async function POST(request: Request) {
  try {
    const xVerify = request.headers.get('X-VERIFY') || '';
    const body = await request.json().catch(() => ({}));
    const base64Response = body.response;

    if (!base64Response || !xVerify) {
      console.warn('PhonePe Webhook: Missing response body or X-VERIFY header');
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    // Verify Callback Signature
    const isValid = verifyPhonePeCallbackSignature(base64Response, xVerify);
    if (!isValid) {
      console.error('PhonePe Webhook: Invalid signature detected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Decode response
    const decodedStr = Buffer.from(base64Response, 'base64').toString('utf-8');
    const callbackData = JSON.parse(decodedStr);
    
    console.log('PhonePe Webhook Callback Data:', callbackData);

    const { success, code, data } = callbackData;
    const { merchantTransactionId, transactionId, amount, state } = data || {};

    if (!success || code !== 'PAYMENT_SUCCESS' || state !== 'COMPLETED') {
      console.log(`PhonePe Webhook: Payment not successful for ${merchantTransactionId}. Code: ${code}, State: ${state}`);
      return NextResponse.json({ success: true, message: 'Payment status not successful' });
    }

    const db = await getDb();
    
    // Find order by phonepe_txn_id
    const order = await db.get(
      'SELECT * FROM orders WHERE phonepe_txn_id = ?',
      [merchantTransactionId]
    );

    if (!order) {
      console.error(`PhonePe Webhook: Order not found for Transaction ID: ${merchantTransactionId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order is already confirmed or processed, return success but don't re-run notifications/assignment
    const alreadyProcessed = ['confirmed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered'].includes(order.status);
    if (alreadyProcessed) {
      console.log(`PhonePe Webhook: Order #${order.id} already processed. Status: ${order.status}`);
      return NextResponse.json({ success: true, message: 'Order already processed' });
    }

    // Verify amount (PhonePe amount is in paise, order total is in rupees)
    const expectedAmountPaise = Math.round(order.total_amount * 100);
    if (Math.abs(expectedAmountPaise - amount) > 1) {
      console.warn(`PhonePe Webhook Amount Mismatch: Order expected ${expectedAmountPaise} paise, PhonePe paid ${amount} paise`);
    }

    // Update order status to confirmed and save payment details
    await db.run(
      "UPDATE orders SET status = 'confirmed', payment_status = 'completed', utr_number = ? WHERE id = ?",
      [transactionId || '', order.id]
    );

    // Send payment confirmation message directly to the customer via Evolution API
    const confirmMsg = `✅ *Payment received successfully.*\nYour order *#${order.id}* (Amount: ₹${order.total_amount.toFixed(2)}) has been confirmed and is being prepared in our kitchen! 👨‍🍳`;
    await sendWhatsAppMessage(order.customer_phone, confirmMsg);

    // Auto-assign rider in round-robin fashion
    const assignedRider = await assignRiderToOrder(order.id);
    
    console.log(`PhonePe Webhook: Order #${order.id} confirmed and assigned to rider: ${assignedRider ? assignedRider.name : 'None available'}`);

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      orderId: order.id,
      assignedRider: assignedRider ? assignedRider.name : 'None'
    });

  } catch (error: any) {
    console.error('PhonePe Webhook execution error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
