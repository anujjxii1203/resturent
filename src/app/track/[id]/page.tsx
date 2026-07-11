'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './track.module.css';

export default function TrackOrder() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch order', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className={styles.container}>Loading order...</div>;
  if (!order) return <div className={styles.container}>Order not found.</div>;

  const getStepStatus = (step: string) => {
    const sequence = ['pending_payment', 'confirmed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'];
    const currentIdx = sequence.indexOf(order.status);
    const stepIdx = sequence.indexOf(step);
    
    if (order.status === 'cancelled') return step === 'cancelled' ? 'active' : 'inactive';
    if (step === 'cancelled') return 'inactive';

    if (currentIdx >= stepIdx) return 'active';
    return 'inactive';
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Order #{order.id}</h1>
          <p>Total: ₹{order.total_amount.toFixed(2)}</p>
        </div>
        
        <div className={styles.timeline}>
          <div className={`${styles.step} ${styles[getStepStatus('confirmed')]}`}>
            <div className={styles.icon}>🍳</div>
            <div className={styles.content}>
              <h3>Confirmed & Preparing</h3>
              <p>Your food is being freshly prepared in our kitchen.</p>
            </div>
          </div>
          
          <div className={`${styles.step} ${styles[getStepStatus('assigned')]}`}>
            <div className={styles.icon}>🛵</div>
            <div className={styles.content}>
              <h3>Rider Assigned</h3>
              {order.delivery_boy_name ? (
                <p>{order.delivery_boy_name} (+91 {order.delivery_boy_phone}) will be delivering your order.</p>
              ) : (
                <p>Waiting for an available delivery partner.</p>
              )}
            </div>
          </div>

          <div className={`${styles.step} ${styles[getStepStatus('picked_up')]}`}>
            <div className={styles.icon}>🛍️</div>
            <div className={styles.content}>
              <h3>Picked Up</h3>
              <p>Order has been packaged and handed over to the rider.</p>
            </div>
          </div>

          <div className={`${styles.step} ${styles[getStepStatus('out_for_delivery')]}`}>
            <div className={styles.icon}>📍</div>
            <div className={styles.content}>
              <h3>Out for Delivery</h3>
              <p>Your rider is on the way!</p>
            </div>
          </div>

          <div className={`${styles.step} ${styles[getStepStatus('delivered')]}`}>
            <div className={styles.icon}>🏁</div>
            <div className={styles.content}>
              <h3>Delivered</h3>
              <p>Enjoy your meal from Swaad Rustam!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
