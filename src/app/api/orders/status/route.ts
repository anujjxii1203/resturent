import { NextResponse } from 'next/server';
import { getDb, sendWhatsAppMessage, assignRiderToOrder } from '@/lib/db';
import { getPhonePeConfig } from '@/lib/phonepe';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId is required' }, { status: 400 });
    }

    const db = await getDb();
    let order = await db.get(
      'SELECT id, status, payment_status, total_amount, customer_name, customer_phone FROM orders WHERE phonepe_txn_id = ?',
      [transactionId]
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order is still pending, proactively check PhonePe since webhook might fail on localhost
    if (order.status === 'pending_payment' || order.payment_status === 'pending_payment') {
      
      // Mock payment status for local testing
      if (process.env.NODE_ENV !== 'production' || !process.env.PHONEPE_MERCHANT_ID) {
        await db.run(
          "UPDATE orders SET status = 'confirmed', payment_status = 'completed', utr_number = ? WHERE id = ?",
          ['MOCK_UTR', order.id]
        );
        const confirmMsg = `✅ *Payment received successfully.*\nYour order *#${order.id}* (Amount: ₹${order.total_amount.toFixed(2)}) has been confirmed and is being prepared in our kitchen! 👨‍🍳`;
        await sendWhatsAppMessage(order.customer_phone, confirmMsg);
        await assignRiderToOrder(order.id);
        
        order.status = 'confirmed';
        order.payment_status = 'completed';
      } else {
        const config = getPhonePeConfig();
      const apiEndpoint = `/pg/v1/status/${config.merchantId}/${transactionId}`;
      const stringToSign = apiEndpoint + config.saltKey;
      const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
      const xVerify = sha256 + '###' + config.saltIndex;

      const response = await fetch(`${config.baseUrl}${apiEndpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': config.merchantId
        }
      });

      const phonePeData = await response.json().catch(() => ({}));

      if (phonePeData.success && phonePeData.data && phonePeData.data.state === 'COMPLETED') {
        // Payment successful, process the order
        await db.run(
          "UPDATE orders SET status = 'confirmed', payment_status = 'completed', utr_number = ? WHERE id = ?",
          [phonePeData.data.providerReferenceId || transactionId, order.id]
        );

        // Send WhatsApp
        const confirmMsg = `✅ *Payment received successfully.*\nYour order *#${order.id}* (Amount: ₹${order.total_amount.toFixed(2)}) has been confirmed and is being prepared in our kitchen! 👨‍🍳`;
        await sendWhatsAppMessage(order.customer_phone, confirmMsg);

        // Assign rider
        await assignRiderToOrder(order.id);

        // Update local object so response shows success
        order.status = 'confirmed';
        order.payment_status = 'completed';
      }
      } // End of else block
    }

    return NextResponse.json({
      success: true,
      status: order.status,
      paymentStatus: order.payment_status,
      orderId: order.id,
      amount: order.total_amount,
      customerName: order.customer_name
    });
  } catch (error: any) {
    console.error('Failed to get order status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status', details: error.message },
      { status: 500 }
    );
  }
}

