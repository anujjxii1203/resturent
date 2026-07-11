'use client';

import { useState, useEffect } from 'react';
import styles from './Cart.module.css';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
}

export default function Cart({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'payment'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; address?: string; phone?: string; utr?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [whatsappShareUrl, setWhatsappShareUrl] = useState('');
  const [upiUrl, setUpiUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Reset steps and forms when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      setStep('cart');
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setSpecialNotes('');
      setUtrNumber('');
      setFormErrors({});
      setOrderSuccess(false);
      setCreatedOrderId(null);
      setErrorMessage('');
      setCopied(false);
      setWhatsappShareUrl('');
      setUpiUrl('');
      setQrCodeUrl('');
    }
  }, [isOpen]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('7303059402@upi');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFormErrors({});

    // Validation
    const errors: { name?: string; address?: string; phone?: string } = {};
    if (!customerName.trim()) {
      errors.name = 'Name is required';
    }
    if (!deliveryAddress.trim()) {
      errors.address = 'Address is required';
    }
    if (!customerPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          delivery_address: deliveryAddress.trim(),
          special_notes: specialNotes.trim(),
          order_items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total_amount: total
        })
      });

      const json = await response.json();
      if (json.success && json.orderId) {
        setCreatedOrderId(json.orderId);
        setOrderSuccess(true);
        
        // Optionally, open WhatsApp for them to track their order
        const siteUrl = window.location.origin;
        const message = `*Order Placed #${json.orderId} - Swaad Rustam & Biryani*\n----------------------------------\n*Name:* ${customerName.trim()}\n*Phone:* ${customerPhone.trim()}\n*Address:* ${deliveryAddress.trim()}\n----------------------------------\n*Total:* *₹${total.toFixed(2)} (Cash on Delivery)*`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/917303059402?text=${encodedMessage}`;
        setWhatsappShareUrl(whatsappUrl);
        
        try {
          // window.open(whatsappUrl, '_blank');
        } catch (e) {
          console.warn('Popup blocked');
        }
      } else {
        setErrorMessage(json.error || 'Failed to register order. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error: Could not connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFormErrors({});

    const cleanUtr = utrNumber.trim().replace(/\D/g, '');
    if (!cleanUtr) {
      setFormErrors({ utr: 'UTR Number is required' });
      return;
    }
    if (cleanUtr.length !== 12) {
      setFormErrors({ utr: 'UTR must be exactly 12 digits' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Hit payment-confirm webhook directly to confirm payment
      const response = await fetch('/api/webhook/payment-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: createdOrderId,
          utr_number: cleanUtr,
          amount: total
        })
      });

      const json = await response.json();
      if (json.success) {
        setOrderSuccess(true);

        const itemsText = cartItems
          .map((item, index) => `${index + 1}. *${item.name}* x ${item.quantity} (₹${(item.price * item.quantity).toFixed(2)})`)
          .join('\n');

        const message = `*Order Paid #${createdOrderId} - Swaad Rustam & Biryani* 
----------------------------------
*Name:* ${customerName.trim()}
*Phone:* ${customerPhone.trim()}
*Address:* ${deliveryAddress.trim()}
----------------------------------
*Order Items:*
${itemsText}
----------------------------------
*Total Paid:* *₹${total.toFixed(2)}*
*UTR Ref No:* ${cleanUtr}
----------------------------------
_I have completed the payment. Please verify the order._`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/917303059402?text=${encodedMessage}`;
        setWhatsappShareUrl(whatsappUrl);
        
        try {
          window.open(whatsappUrl, '_blank');
        } catch (e) {
          console.warn('Popup blocked, customer can use manual button');
        }
      } else {
        setErrorMessage(json.error || 'Failed to verify payment. Please verify your UTR code or contact the owner.');
      }
    } catch (err) {
      setErrorMessage('Network error: Could not verify payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <>
        {isOpen && <div className={styles.backdrop} onClick={onClose} />}
        <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
          <div className={styles.drawerHeader}>
            <h2 className={styles.drawerTitle}>Order Submitted</h2>
            <button className={styles.closeBtn} onClick={() => { onClearCart(); onClose(); }} aria-label="Close cart">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className={styles.successContainer}>
            <div className={styles.successIconWrapper}>
              <svg className={styles.successIcon} width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 className={styles.successHeading}>Order #{createdOrderId} Logged</h3>
            <p className={styles.successText}>
              Your order will be delivered soon! Please pay <strong>₹{total.toFixed(2)}</strong> via Cash or UPI upon delivery.
            </p>
            <p className={styles.successSub}>
              You will receive a WhatsApp message shortly with your live tracking link.
            </p>
            
            <a 
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.finishBtn}
              style={{ 
                background: '#25D366', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem', 
                textDecoration: 'none', 
                width: '100%', 
                marginBottom: '0.8rem',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.335 4.963L2 22l5.21-1.366a9.927 9.927 0 004.8 1.234h.005c5.507 0 9.99-4.478 9.99-9.985A9.99 9.99 0 0012.012 2zm6.208 14.286c-.255.722-1.488 1.4-2.029 1.487-.492.079-.974.346-3.136-.505-2.766-1.089-4.526-3.896-4.665-4.083-.138-.186-1.123-1.493-1.123-2.848 0-1.355.706-2.018.956-2.28.256-.263.56-.329.746-.329H9.46c.168 0 .393-.063.606.447.218.522.747 1.823.81 1.954.062.13.104.283.016.455-.088.17-.132.278-.261.428-.13.15-.272.336-.39.45-.13.125-.268.261-.115.522.152.261.677 1.114 1.453 1.805.998.89 1.838 1.168 2.099 1.298.26.13.411.109.565-.065.153-.174.655-.762.831-1.023.175-.26.35-.217.59-.13.24.087 1.52.717 1.782.847.262.13.438.196.5.305.063.11.063.633-.192 1.355z"/>
              </svg>
              <span>Send via WhatsApp</span>
            </a>

            <button 
              className={styles.finishBtn} 
              style={{ 
                background: 'transparent', 
                border: '1.5px solid var(--primary-green)', 
                color: 'var(--primary-green)',
                width: '100%'
              }}
              onClick={() => {
                onClearCart();
                onClose();
              }}
            >
              Done & Close
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className={styles.backdrop} onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          {step !== 'cart' ? (
            <button 
              className={styles.backBtn} 
              onClick={() => setStep(step === 'payment' ? 'checkout' : 'cart')} 
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <h2 className={styles.drawerTitle}>Your Cart</h2>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyIcon} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p className={styles.emptyText}>Your cart is empty.</p>
            <p className={styles.emptySubtext}>Add legendary items and savor the delicious flavors!</p>
            <button className={styles.shopBtn} onClick={onClose}>
              Explore Menu
            </button>
          </div>
        ) : step === 'cart' ? (
          <div className={styles.drawerBody}>
            <div className={styles.itemsList}>
              {cartItems.map(item => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.quantityWidget}>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className={styles.qtyBtn}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className={styles.qtyBtn}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.id)} 
                      className={styles.removeBtn}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.drawerFooter}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span className={styles.summaryTotal}>₹{total.toFixed(2)}</span>
              </div>
              <p className={styles.taxNotice}>*Taxes and delivery charges calculated at checkout.</p>
              
              <button className={styles.checkoutBtn} onClick={() => setStep('checkout')}>
                <span>Checkout</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ) : step === 'checkout' ? (
          <form onSubmit={handleProceedToPayment} className={styles.checkoutForm}>
            <div className={styles.formScrollBody}>
              <h3 className={styles.formSectionTitle}>Delivery Details</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="customerName" className={styles.formLabel}>Your Name *</label>
                <input 
                  type="text" 
                  id="customerName" 
                  value={customerName} 
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Enter your full name" 
                  className={`${styles.formInput} ${formErrors.name ? styles.inputError : ''}`}
                />
                {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="customerPhone" className={styles.formLabel}>Phone Number *</label>
                <input 
                  type="tel" 
                  id="customerPhone" 
                  value={customerPhone} 
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="Enter 10-digit mobile number" 
                  className={`${styles.formInput} ${formErrors.phone ? styles.inputError : ''}`}
                />
                {formErrors.phone && <span className={styles.errorText}>{formErrors.phone}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deliveryAddress" className={styles.formLabel}>Delivery Address *</label>
                <textarea 
                  id="deliveryAddress" 
                  rows={3}
                  value={deliveryAddress} 
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    if (formErrors.address) setFormErrors(prev => ({ ...prev, address: undefined }));
                  }}
                  placeholder="Enter your complete delivery address" 
                  className={`${styles.formTextarea} ${formErrors.address ? styles.inputError : ''}`}
                />
                {formErrors.address && <span className={styles.errorText}>{formErrors.address}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="specialNotes" className={styles.formLabel}>Notes / Instructions</label>
                <textarea 
                  id="specialNotes" 
                  rows={2}
                  value={specialNotes} 
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="E.g., Spice preferences, flat number, drop at gate" 
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.orderSummaryMini}>
                <span className={styles.summaryMiniLabel}>Order Summary:</span>
                <div className={styles.summaryMiniItems}>
                  {cartItems.map(item => (
                    <div key={item.id} className={styles.miniItemRow}>
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <div className={styles.summaryRow}>
                <span>Total Amount</span>
                <span className={styles.summaryTotal}>₹{total.toFixed(2)}</span>
              </div>
              <button type="submit" disabled={isSubmitting} className={styles.checkoutBtn}>
                <span>{isSubmitting ? 'Placing Order...' : 'Place Order (Cash on Delivery)'}</span>
                {!isSubmitting && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOrderSubmit} className={styles.checkoutForm}>
            <div className={styles.formScrollBody}>
              <h3 className={styles.formSectionTitle} style={{ marginBottom: '0.5rem' }}>UPI QR Code Payment</h3>
              <p className={styles.paymentIntro}>Scan this QR code using any UPI app (GPay, PhonePe, Paytm, BHIM) to pay exactly <strong>₹{total.toFixed(2)}</strong>.</p>
              
              <div className={styles.qrCodeWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="UPI QR Code" className={styles.qrCodeImg} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <a 
                  href={upiUrl}
                  className={styles.upiPayBtn}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.85rem',
                    background: 'var(--primary-orange)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: '600',
                    textAlign: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 4px 10px rgba(223, 160, 50, 0.2)'
                  }}
                >
                  📱 Pay Directly via UPI App
                </a>
                
                <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  💬 We have sent the payment link to your WhatsApp number (<strong>{customerPhone}</strong>). Please complete the payment. Your order will be confirmed automatically once payment is received.
                </div>
              </div>

              <div className={styles.upiDetails}>
                <span className={styles.upiLabel}>Merchant UPI ID:</span>
                <div className={styles.upiCopyWrapper}>
                  <code className={styles.upiId}>7303059402@upi</code>
                  <button type="button" onClick={handleCopyUpi} className={styles.copyBtn}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                <label htmlFor="utrNumber" className={styles.formLabel}>Verify Manually (Enter 12-Digit UPI UTR No)</label>
                <input 
                  type="text" 
                  id="utrNumber" 
                  value={utrNumber} 
                  onChange={(e) => {
                    setUtrNumber(e.target.value);
                    if (formErrors.utr) setFormErrors(prev => ({ ...prev, utr: undefined }));
                  }}
                  maxLength={12}
                  placeholder="E.g. 629482018593" 
                  className={`${styles.formInput} ${formErrors.utr ? styles.inputError : ''}`}
                />
                {formErrors.utr && <span className={styles.errorText}>{formErrors.utr}</span>}
                <p className={styles.inputHelp}>Submit this only if your order has not automatically updated on WhatsApp after paying.</p>
              </div>

              {errorMessage && (
                <div className={styles.submitError}>
                  {errorMessage}
                </div>
              )}
            </div>

            <div className={styles.drawerFooter}>
              <div className={styles.summaryRow}>
                <span>Amount to Pay</span>
                <span className={styles.summaryTotal}>₹{total.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                <button type="submit" disabled={isSubmitting} className={styles.whatsappSubmitBtn} style={{ width: '100%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>{isSubmitting ? 'Verifying Payment...' : 'Verify & Confirm Order'}</span>
                </button>
                
                <a 
                  href={`https://wa.me/917303059402?text=${encodeURIComponent(`Hi, I placed Order #${createdOrderId} (Amount: ₹${total.toFixed(2)}) at Swaad Rustam. Please confirm my payment!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.finishBtn}
                  style={{ 
                    background: '#25D366', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem', 
                    textDecoration: 'none', 
                    width: '100%',
                    color: '#ffffff',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  💬 Chat on WhatsApp to Confirm
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
