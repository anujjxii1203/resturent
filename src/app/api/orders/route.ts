import { NextResponse } from 'next/server';
import { getDb, sendWhatsAppMessage } from '@/lib/db';
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
       VALUES (?, ?, ?, ?, ?, ?, 'pending_payment', 'pending_payment')`,
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

    // Initialize PhonePe Payment
    const { generatePhonePeHeaders, getPhonePeConfig } = await import('@/lib/phonepe');
    
    const merchantTransactionId = `TXN_SW_ORDER_${orderId}`;
    const amountInPaise = Math.round(parseFloat(total_amount) * 100);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cleanPhone = customer_phone.replace(/\D/g, '').slice(-10);

    const payload = {
      merchantId: getPhonePeConfig().merchantId,
      merchantTransactionId,
      merchantUserId: `USER_${customer_phone.replace(/\D/g, '')}`,
      amount: amountInPaise,
      redirectUrl: `${siteUrl}/payment-status?transactionId=${merchantTransactionId}`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${siteUrl}/api/webhook/phonepe`,
      mobileNumber: cleanPhone.length === 10 ? cleanPhone : '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const apiEndpoint = '/pg/v1/pay';
    const { base64Payload, xVerify } = generatePhonePeHeaders(payload, apiEndpoint);
    const phonepeConfig = getPhonePeConfig();

    // Mock payment for local testing if no real Merchant ID is provided or in dev mode
    if (process.env.NODE_ENV !== 'production' || !process.env.PHONEPE_MERCHANT_ID) {
      await db.run('UPDATE orders SET phonepe_txn_id = ? WHERE id = ?', [merchantTransactionId, orderId]);
      return NextResponse.json({
        success: true,
        message: 'Order created (MOCKED PAYMENT)',
        orderId,
        redirectUrl: `${siteUrl}/payment-status?transactionId=${merchantTransactionId}&code=PAYMENT_SUCCESS&merchantId=${phonepeConfig.merchantId}`
      });
    }

    const phonepeRes = await fetch(`${phonepeConfig.baseUrl}${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const phonepeJson = await phonepeRes.json().catch(() => ({}));
    if (!phonepeRes.ok || !phonepeJson.success) {
      console.error('PhonePe Pay request failed:', phonepeJson);
      return NextResponse.json(
        { error: 'Failed to initiate payment with PhonePe', details: phonepeJson.message },
        { status: 500 }
      );
    }

    const redirectUrl = phonepeJson.data.instrumentResponse.redirectInfo.url;

    // Update order with transaction ID
    await db.run(
      'UPDATE orders SET phonepe_txn_id = ? WHERE id = ?',
      [merchantTransactionId, orderId]
    );

    return NextResponse.json({
      success: true,
      message: 'Order created and payment initiated',
      orderId,
      redirectUrl
    });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
