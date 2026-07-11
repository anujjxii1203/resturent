'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './admin.module.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  occasion: string;
  special_requests: string;
  status: string;
  created_at: string;
}

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
  approved: number;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  available: number;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  special_notes: string;
  order_items: OrderItem[];
  total_amount: number;
  utr_number: string;
  phonepe_txn_id: string;
  payment_status: string;
  status: string;
  delivery_boy_id: number | null;
  delivery_boy_name: string | null;
  delivery_boy_phone: string | null;
  created_at: string;
}

interface DeliveryBoy {
  id: number;
  name: string;
  phone: string;
  status: string; // 'available', 'busy', 'offline'
  last_assigned_at: string | null;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);

  // Refs for tracking counts to trigger audio
  const prevOrdersCountRef = useRef<number>(0);
  const prevReservationsCountRef = useRef<number>(0);

  const playNotificationSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(1760, context.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'orders' | 'delivery' | 'bookings' | 'reviews' | 'menu' | 'analytics'>('orders');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [selectedBoys, setSelectedBoys] = useState<Record<number, number>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form states for adding a new delivery partner
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderStatus, setNewRiderStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [submittingRider, setSubmittingRider] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch Reservations
      const resRes = await fetch('/api/reservations');
      if (resRes.status === 401) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }
      const resJson = await resRes.json();
      if (resJson.success) {
        setReservations(resJson.data);
        setIsLoggedIn(true);
      }

      // Fetch Reviews
      const revRes = await fetch('/api/reviews?admin=true');
      if (revRes.ok) {
        const revJson = await revRes.json();
        if (revJson.success) {
          setReviews(revJson.data);
        }
      }

      // Fetch Menu
      const menuRes = await fetch('/api/menu');
      if (menuRes.ok) {
        const menuJson = await menuRes.json();
        if (menuJson.success) {
          setMenuItems(menuJson.data);
        }
      }

      // Fetch Orders
      const ordRes = await fetch('/api/orders');
      if (ordRes.ok) {
        const ordJson = await ordRes.json();
        if (ordJson.success) {
          setOrders(ordJson.data);
        }
      }

      // Fetch Delivery Boys
      const dbRes = await fetch('/api/delivery-boys');
      if (dbRes.ok) {
        const dbJson = await dbRes.json();
        if (dbJson.success) {
          setDeliveryBoys(dbJson.data);
        }
      }
      
      // Check if we need to play sound (only if we already had data loaded)
      if (prevOrdersCountRef.current > 0 && ordRes.ok) {
        const ordJson = await ordRes.clone().json();
        if (ordJson.success && ordJson.data.length > prevOrdersCountRef.current) {
          playNotificationSound();
        }
      }
      if (prevReservationsCountRef.current > 0 && resRes.ok) {
        const resJson = await resRes.clone().json();
        if (resJson.success && resJson.data.length > prevReservationsCountRef.current) {
          playNotificationSound();
        }
      }

      // Update refs
      if (ordRes.ok) {
        const ordJson = await ordRes.clone().json();
        if (ordJson.success) prevOrdersCountRef.current = ordJson.data.length;
      }
      if (resRes.ok) {
        const resJson = await resRes.clone().json();
        if (resJson.success) prevReservationsCountRef.current = resJson.data.length;
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on load to check login state
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Poll for new data every 15 seconds
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.success) {
        setIsLoggedIn(true);
        loadDashboardData();
      } else {
        setLoginError(json.message || 'Incorrect admin password');
      }
    } catch (err) {
      setLoginError('Network error: Could not log in');
    }
  };

  const handleLogout = async () => {
    document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setIsLoggedIn(false);
  };

  // ----------------------------------------------------
  // ORDER ACTIONS
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: number, status: string, deliveryBoyId?: number | null) => {
    try {
      const body: any = { status };
      if (deliveryBoyId !== undefined) {
        body.delivery_boy_id = deliveryBoyId;
      }
      
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        // Refresh local data
        const ordRes = await fetch('/api/orders');
        if (ordRes.ok) {
          const ordJson = await ordRes.json();
          if (ordJson.success) {
            setOrders(ordJson.data);
          }
        }
        // Refresh riders to get updated busy/available status
        const dbRes = await fetch('/api/delivery-boys');
        if (dbRes.ok) {
          const dbJson = await dbRes.json();
          if (dbJson.success) {
            setDeliveryBoys(dbJson.data);
          }
        }
      } else {
        alert(json.error || 'Failed to update order');
      }
    } catch (err) {
      alert('Error updating order');
    }
  };

  const handleManualAssignRider = async (orderId: number) => {
    const selectedRiderId = selectedBoys[orderId];
    if (!selectedRiderId) {
      alert('Please select a rider first');
      return;
    }
    // Update order with rider and status 'assigned'
    await handleUpdateOrderStatus(orderId, 'assigned', selectedRiderId);
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order record?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setOrders(prev => prev.filter(o => o.id !== id));
      }
    } catch (err) {
      alert('Error deleting order');
    }
  };

  // ----------------------------------------------------
  // DELIVERY PARTNERS CRUD
  // ----------------------------------------------------
  const handleAddDeliveryBoy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiderName.trim() || !newRiderPhone.trim()) {
      alert('Name and Phone are required');
      return;
    }
    setSubmittingRider(true);
    try {
      const res = await fetch('/api/delivery-boys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRiderName.trim(),
          phone: newRiderPhone.trim(),
          status: newRiderStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewRiderName('');
        setNewRiderPhone('');
        setNewRiderStatus('available');
        
        // Reload delivery boys
        const dbRes = await fetch('/api/delivery-boys');
        if (dbRes.ok) {
          const dbJson = await dbRes.json();
          if (dbJson.success) {
            setDeliveryBoys(dbJson.data);
          }
        }
      } else {
        alert(json.error || 'Failed to add delivery boy');
      }
    } catch (err) {
      alert('Error adding delivery partner');
    } finally {
      setSubmittingRider(false);
    }
  };

  const handleUpdateRiderStatus = async (riderId: number, status: string) => {
    try {
      const res = await fetch(`/api/delivery-boys/${riderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        setDeliveryBoys(prev =>
          prev.map(b => (b.id === riderId ? { ...b, status } : b))
        );
      } else {
        alert(json.error || 'Failed to update rider status');
      }
    } catch (err) {
      alert('Error updating rider status');
    }
  };

  const handleDeleteRider = async (id: number) => {
    if (!confirm('Are you sure you want to remove this delivery partner?')) return;
    try {
      const res = await fetch(`/api/delivery-boys/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeliveryBoys(prev => prev.filter(b => b.id !== id));
      } else {
        alert(json.error || 'Failed to delete delivery boy');
      }
    } catch (err) {
      alert('Error deleting delivery boy');
    }
  };

  // ----------------------------------------------------
  // OTHER ADMINISTRATIVE ACTIONS
  // ----------------------------------------------------
  const handleUpdateReservation = async (id: number, status: 'approved' | 'cancelled') => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setReservations(prev =>
          prev.map(r => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch (err) {
      alert('Error updating reservation');
    }
  };

  const handleDeleteReservation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setReservations(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert('Error deleting reservation');
    }
  };

  const handleUpdateReview = async (id: number, approved: number) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      const json = await res.json();
      if (json.success) {
        setReviews(prev => prev.map(r => (r.id === id ? { ...r, approved } : r)));
      } else {
        alert(json.error || 'Failed to update review status');
      }
    } catch (err) {
      alert('Error updating review');
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        alert(json.error || 'Failed to delete review');
      }
    } catch (err) {
      alert('Error deleting review');
    }
  };

  const handleToggleMenuAvailability = async (item: MenuItem) => {
    const nextAvailability = item.available === 1 ? 0 : 1;
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          available: nextAvailability,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMenuItems(prev =>
          prev.map(m => (m.id === item.id ? { ...m, available: nextAvailability } : m))
        );
      }
    } catch (err) {
      alert('Error toggling availability');
    }
  };

  // ----------------------------------------------------
  // UTILITY RENDER HELPERS
  // ----------------------------------------------------
  const getConfirmationWhatsAppUrl = (order: Order) => {
    const msg = `*Order Confirmation - Swaad Rustam & Biryani*
----------------------------------
Hi ${order.customer_name},
Your payment for *Order #${order.id}* (Total: ₹${order.total_amount.toFixed(2)}) has been verified and confirmed! 
We are preparing your food now.

We will notify you once it's out for delivery. 
Thank you for ordering with us!`;
    const encoded = encodeURIComponent(msg);
    const customerPhoneClean = order.customer_phone.replace(/\D/g, '');
    const phoneWithCode = customerPhoneClean.startsWith('91') ? customerPhoneClean : `91${customerPhoneClean}`;
    return `https://wa.me/${phoneWithCode}?text=${encoded}`;
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Pending Payment';
      case 'confirmed': return 'Confirmed';
      case 'assigned': return 'Assigned';
      case 'picked_up': return 'Picked Up';
      case 'out_for_delivery': return 'Out For Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  // Stats calculation
  const totalRev = orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment').reduce((sum, o) => sum + o.total_amount, 0);
  const pendingPaymentsCount = orders.filter(o => o.status === 'pending_payment').length;
  const activeDeliveriesCount = orders.filter(o => ['assigned', 'picked_up', 'out_for_delivery'].includes(o.status)).length;
  const availableRidersCount = deliveryBoys.filter(b => b.status === 'available').length;

  // ----------------------------------------------------
  // ANALYTICS CALCULATIONS
  // ----------------------------------------------------
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const revenueData = last7Days.map(dateLabel => {
    const total = orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment')
      .filter(o => new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dateLabel)
      .reduce((sum, o) => sum + o.total_amount, 0);
    return { name: dateLabel, Revenue: total };
  });

  const itemSales: Record<string, number> = {};
  orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment')
    .forEach(o => {
      try {
        const items = typeof o.order_items === 'string' ? JSON.parse(o.order_items) : o.order_items;
        items.forEach((item: any) => {
          itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
        });
      } catch(e) {}
    });

  const topItemsData = Object.entries(itemSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, Sales: count }));

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending_payment') return order.status === 'pending_payment';
    if (filterStatus === 'active') return ['confirmed', 'assigned', 'picked_up', 'out_for_delivery'].includes(order.status);
    if (filterStatus === 'delivered') return order.status === 'delivered';
    if (filterStatus === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  // Login View
  if (!isLoggedIn) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h2 className={styles.title}>Swaad Rustam Admin</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>Please enter administrative password to authenticate.</p>
          
          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{ color: '#eb5757', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
                {loginError}
              </div>
            )}
            <div className={styles.formGroup} style={{ textAlign: 'left' }}>
              <label htmlFor="adm-pass">Password</label>
              <input
                type="password"
                id="adm-pass"
                className={styles.formInput}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} style={{ marginTop: '1rem' }}>
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2>Swaad Rustam</h2>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary-gold)' }}>Admin Console</span>
        </div>

        <nav className={styles.sidebarNav}>
          <button 
            className={`${styles.navButton} ${activeTab === 'orders' ? styles.activeNavButton : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Active Orders
            {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
              <span className={styles.navBadge}>{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</span>
            )}
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'delivery' ? styles.activeNavButton : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            🚚 Delivery Partners
            {availableRidersCount > 0 && (
              <span className={styles.navBadge} style={{ background: '#2eb872' }}>{availableRidersCount}</span>
            )}
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'bookings' ? styles.activeNavButton : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Reservations
            {reservations.filter(r => r.status === 'pending').length > 0 && (
              <span className={styles.navBadge}>{reservations.filter(r => r.status === 'pending').length}</span>
            )}
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'reviews' ? styles.activeNavButton : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            ⭐ Reviews Moderation
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'menu' ? styles.activeNavButton : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍔 Menu Control
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'analytics' ? styles.activeNavButton : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Exit Console
        </button>
      </aside>

      {/* Main dashboard content */}
      <main className={styles.mainContent}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Retrieving dashboard details...
          </div>
        ) : (
          <>
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                <h1 className={styles.tabHeading}>Orders & Delivery Dashboard</h1>
                <p className={styles.tabSubtitle}>Track payment statuses, round-robin rider assignments, and order delivery workflows.</p>

                {/* Stats row */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statDetails}>
                      <span className={styles.statValue}>₹{totalRev.toLocaleString('en-IN')}</span>
                      <span className={styles.statLabel}>Revenue Confirmed</span>
                    </div>
                    <span className={styles.statIcon}>💰</span>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statDetails}>
                      <span className={styles.statValue}>{pendingPaymentsCount}</span>
                      <span className={styles.statLabel}>Awaiting Payments</span>
                    </div>
                    <span className={styles.statIcon}>⏳</span>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statDetails}>
                      <span className={styles.statValue}>{activeDeliveriesCount}</span>
                      <span className={styles.statLabel}>Active Deliveries</span>
                    </div>
                    <span className={styles.statIcon}>🏍️</span>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statDetails}>
                      <span className={styles.statValue}>{availableRidersCount} / {deliveryBoys.length}</span>
                      <span className={styles.statLabel}>Available Riders</span>
                    </div>
                    <span className={styles.statIcon}>🟢</span>
                  </div>
                </div>

                {/* Filter and orders list */}
                <div className={styles.filterBar}>
                  <div className={styles.filterTabs}>
                    <button 
                      className={`${styles.filterTabBtn} ${filterStatus === 'all' ? styles.filterTabBtnActive : ''}`}
                      onClick={() => setFilterStatus('all')}
                    >
                      All Orders ({orders.length})
                    </button>
                    <button 
                      className={`${styles.filterTabBtn} ${filterStatus === 'pending_payment' ? styles.filterTabBtnActive : ''}`}
                      onClick={() => setFilterStatus('pending_payment')}
                    >
                      Awaiting Payment ({pendingPaymentsCount})
                    </button>
                    <button 
                      className={`${styles.filterTabBtn} ${filterStatus === 'active' ? styles.filterTabBtnActive : ''}`}
                      onClick={() => setFilterStatus('active')}
                    >
                      Active Fulfillment ({activeDeliveriesCount + orders.filter(o => o.status === 'confirmed').length})
                    </button>
                    <button 
                      className={`${styles.filterTabBtn} ${filterStatus === 'delivered' ? styles.filterTabBtnActive : ''}`}
                      onClick={() => setFilterStatus('delivered')}
                    >
                      Delivered ({orders.filter(o => o.status === 'delivered').length})
                    </button>
                    <button 
                      className={`${styles.filterTabBtn} ${filterStatus === 'cancelled' ? styles.filterTabBtnActive : ''}`}
                      onClick={() => setFilterStatus('cancelled')}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', background: '#111511', border: '1px solid var(--border-green)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                    No orders match the selected filter.
                  </div>
                ) : (
                  <div className={styles.ordersGrid}>
                    {filteredOrders.map((order) => {
                      const currentStatus = order.status;
                      const hasRider = !!order.delivery_boy_id;
                      
                      // Status index mapping for the progress bar
                      const statuses = ['pending_payment', 'confirmed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered'];
                      const currentStatusIdx = statuses.indexOf(currentStatus);
                      
                      return (
                        <div key={order.id} className={styles.orderCard} style={{ borderLeft: currentStatus === 'cancelled' ? '4px solid #eb5757' : (currentStatus === 'delivered' ? '4px solid #2eb872' : '4px solid var(--primary-orange)') }}>
                          {/* Card Header */}
                          <div className={styles.orderCardHeader}>
                            <div className={styles.orderMeta}>
                              <h3>Order #{order.id}</h3>
                              <span>Logged on {new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} at {new Date(order.created_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
                            </div>
                            <div>
                              <span className={`${styles.badge} ${styles['badge-' + order.status]}`}>
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </div>
                          </div>

                          {/* Customer & Items Split */}
                          <div className={styles.orderCustomerGrid}>
                            <div className={styles.customerInfoSection}>
                              <h4>📍 Customer Details</h4>
                              <div className={styles.customerInfoBox}>
                                <span style={{ fontWeight: '600', color: '#ffffff' }}>{order.customer_name}</span>
                                <a 
                                  href={`https://wa.me/${order.customer_phone.replace(/\D/g, '').startsWith('91') ? order.customer_phone.replace(/\D/g, '') : '91' + order.customer_phone.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={styles.customerPhone}
                                >
                                  📞 +{order.customer_phone} 
                                  <span style={{ fontSize: '0.75rem', background: '#25d366', color: '#000000', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>WA Chat</span>
                                </a>
                                <span className={styles.customerAddress}>{order.delivery_address}</span>
                                {order.special_notes && (
                                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(223, 160, 50, 0.05)', border: '1px dashed rgba(223, 160, 50, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--primary-gold)' }}>
                                    📝 <em>"{order.special_notes}"</em>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className={styles.itemsInfoSection}>
                              <h4>🍽️ Order Items</h4>
                              <table className={styles.itemsListTable}>
                                <tbody>
                                  {order.order_items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.name} <strong style={{ color: 'var(--text-light)' }}>x{item.quantity}</strong></td>
                                      <td className={styles.priceCol}>₹{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                  <tr className={styles.orderTotalRow}>
                                    <td>Total Amount</td>
                                    <td className={styles.priceCol}>₹{order.total_amount.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                              
                              <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {order.phonepe_txn_id && (
                                  <div>
                                    <span style={{ color: 'var(--text-muted)' }}>PhonePe Txn:</span>{' '}
                                    <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: '#dfa032' }}>
                                      {order.phonepe_txn_id}
                                    </code>
                                  </div>
                                )}
                                {order.utr_number && (
                                  <div>
                                    <span style={{ color: 'var(--text-muted)' }}>Bank UTR:</span>{' '}
                                    <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}>
                                      {order.utr_number}
                                    </code>
                                  </div>
                                )}
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Payment:</span>{' '}
                                  <span style={{ 
                                    fontWeight: '600', 
                                    color: order.payment_status === 'completed' ? '#2eb872' : (order.payment_status === 'failed' ? '#eb5757' : '#dfa032'),
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem'
                                  }}>
                                    {order.payment_status || 'PENDING'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Visual Progress Bar (if not cancelled) */}
                          {currentStatus !== 'cancelled' && (
                            <div className={styles.statusTracker}>
                              {statuses.map((s, idx) => {
                                const isActive = currentStatusIdx === idx;
                                const isCompleted = currentStatusIdx > idx;
                                return (
                                  <div key={s} className={`${styles.trackerStep} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepCompleted : ''}`}>
                                    <div className={styles.trackerNode}>
                                      {isCompleted ? '✓' : idx + 1}
                                    </div>
                                    <span className={styles.trackerLabel}>{getOrderStatusLabel(s)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Card Actions Box */}
                          <div className={styles.orderActionsArea}>
                            <div className={styles.riderInfoBox}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Delivery Agent Status</span>
                              {order.delivery_boy_name ? (
                                <span style={{ fontWeight: '600', color: 'var(--primary-gold)', fontSize: '0.9rem' }}>
                                  🏍️ {order.delivery_boy_name} (+91 {order.delivery_boy_phone})
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                  Rider not assigned yet
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* Action buttons matching the status flow */}
                              {currentStatus === 'pending_payment' && (
                                <button 
                                  className={`${styles.actionBtn} ${styles.btnApprove}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                >
                                  ✓ Force Confirm Payment
                                </button>
                              )}

                              {currentStatus === 'confirmed' && (
                                <div className={styles.riderAssignmentControls}>
                                  <select 
                                    className={styles.boySelect}
                                    value={selectedBoys[order.id] || ''}
                                    onChange={(e) => setSelectedBoys(prev => ({ ...prev, [order.id]: parseInt(e.target.value, 10) }))}
                                  >
                                    <option value="">Select Rider...</option>
                                    {deliveryBoys.map(boy => (
                                      <option key={boy.id} value={boy.id} disabled={boy.status === 'offline'}>
                                        {boy.name} ({boy.status})
                                      </option>
                                    ))}
                                  </select>
                                  <button 
                                    className={`${styles.actionBtn} ${styles.btnApprove}`}
                                    onClick={() => handleManualAssignRider(order.id)}
                                  >
                                    Assign Rider
                                  </button>
                                </div>
                              )}

                              {currentStatus === 'assigned' && (
                                <button 
                                  className={`${styles.actionBtn} ${styles.btnApprove}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'picked_up')}
                                >
                                  🍕 Mark Food Picked Up
                                </button>
                              )}

                              {currentStatus === 'picked_up' && (
                                <button 
                                  className={`${styles.actionBtn} ${styles.btnApprove}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                                >
                                  🏍️ Dispatch (Out for Delivery)
                                </button>
                              )}

                              {currentStatus === 'out_for_delivery' && (
                                <button 
                                  className={`${styles.actionBtn} ${styles.btnApprove}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                >
                                  🏁 Mark Delivered Successfully
                                </button>
                              )}

                              {/* Manual override / reassignment for non-completed orders */}
                              {!['pending_payment', 'delivered', 'cancelled'].includes(currentStatus) && (
                                <div className={styles.riderAssignmentControls} style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '0.6rem' }}>
                                  <select 
                                    className={styles.boySelect}
                                    value={selectedBoys[order.id] || ''}
                                    onChange={(e) => setSelectedBoys(prev => ({ ...prev, [order.id]: parseInt(e.target.value, 10) }))}
                                    style={{ width: '130px', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                                  >
                                    <option value="">Reassign...</option>
                                    {deliveryBoys.map(boy => (
                                      <option key={boy.id} value={boy.id} disabled={boy.status === 'offline'}>
                                        {boy.name} ({boy.status})
                                      </option>
                                    ))}
                                  </select>
                                  <button 
                                    className={`${styles.actionBtn} ${styles.btnCancel}`}
                                    onClick={() => handleManualAssignRider(order.id)}
                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                  >
                                    Reassign
                                  </button>
                                </div>
                              )}

                              {/* Cancel/Delete */}
                              {currentStatus !== 'delivered' && currentStatus !== 'cancelled' && (
                                <button 
                                  className={`${styles.actionBtn} ${styles.btnCancel}`}
                                  onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                >
                                  Cancel Order
                                </button>
                              )}

                              <button 
                                className={`${styles.actionBtn} ${styles.btnDelete}`}
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                Delete Record
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* DELIVERY PARTNERS TAB */}
            {activeTab === 'delivery' && (
              <div>
                <h1 className={styles.tabHeading}>Manage Delivery Partners</h1>
                <p className={styles.tabSubtitle}>Add new riders, toggle active statuses, and inspect round-robin queues.</p>

                <div className={styles.ridersTabContent}>
                  {/* Left Column: List of Riders */}
                  <div className={styles.ridersListSection}>
                    {deliveryBoys.length === 0 ? (
                      <div style={{ padding: '3rem', textAlign: 'center', background: '#111511', border: '1px solid var(--border-green)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                        No delivery partners registered yet. Use the form on the right to add riders.
                      </div>
                    ) : (
                      <div className={styles.ridersListGrid}>
                        {deliveryBoys.map((boy) => (
                          <div key={boy.id} className={styles.riderCard}>
                            <div className={styles.riderHeaderInfo}>
                              <div className={styles.riderName}>
                                <h3>{boy.name}</h3>
                                <a href={`tel:${boy.phone}`} className={styles.riderPhone}>📞 +{boy.phone}</a>
                              </div>
                              <div>
                                <span className={`${styles.statusIndicatorBadge} ${styles['status_' + boy.status]}`}>
                                  {boy.status}
                                </span>
                              </div>
                            </div>

                            {/* Status controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick Status Toggle</span>
                              <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button 
                                  onClick={() => handleUpdateRiderStatus(boy.id, 'available')}
                                  className={`${styles.actionBtn}`} 
                                  style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem', background: boy.status === 'available' ? 'rgba(46,184,114,0.15)' : 'rgba(255,255,255,0.02)', borderColor: boy.status === 'available' ? '#2eb872' : 'rgba(255,255,255,0.1)', color: boy.status === 'available' ? '#2eb872' : 'var(--text-muted)' }}
                                >
                                  Available
                                </button>
                                <button 
                                  onClick={() => handleUpdateRiderStatus(boy.id, 'busy')}
                                  className={`${styles.actionBtn}`} 
                                  style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem', background: boy.status === 'busy' ? 'rgba(223,160,50,0.15)' : 'rgba(255,255,255,0.02)', borderColor: boy.status === 'busy' ? '#dfa032' : 'rgba(255,255,255,0.1)', color: boy.status === 'busy' ? '#dfa032' : 'var(--text-muted)' }}
                                >
                                  Busy
                                </button>
                                <button 
                                  onClick={() => handleUpdateRiderStatus(boy.id, 'offline')}
                                  className={`${styles.actionBtn}`} 
                                  style={{ flex: 1, padding: '0.3rem', fontSize: '0.75rem', background: boy.status === 'offline' ? 'rgba(235,87,87,0.15)' : 'rgba(255,255,255,0.02)', borderColor: boy.status === 'offline' ? '#eb5757' : 'rgba(255,255,255,0.1)', color: boy.status === 'offline' ? '#eb5757' : 'var(--text-muted)' }}
                                >
                                  Offline
                                </button>
                              </div>
                            </div>

                            <div className={styles.riderFooter}>
                              <span className={styles.riderLastAssigned}>
                                {boy.last_assigned_at 
                                  ? `Last assigned: ${new Date(boy.last_assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                  : 'Not assigned yet'}
                              </span>
                              <div className={styles.riderActions}>
                                <button 
                                  className={`${styles.actionBtn} ${styles.btnCancel}`} 
                                  onClick={() => handleDeleteRider(boy.id)}
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Add Rider Form */}
                  <div className={styles.riderFormSection}>
                    <form onSubmit={handleAddDeliveryBoy} className={styles.formCard}>
                      <h3>Add New Rider</h3>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="rider-name">Rider Full Name *</label>
                        <input 
                          type="text" 
                          id="rider-name" 
                          className={styles.formInput} 
                          placeholder="E.g. Amit Sharma"
                          value={newRiderName}
                          onChange={(e) => setNewRiderName(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="rider-phone">WhatsApp Number *</label>
                        <input 
                          type="tel" 
                          id="rider-phone" 
                          className={styles.formInput} 
                          placeholder="E.g. 9891283921"
                          value={newRiderPhone}
                          onChange={(e) => setNewRiderPhone(e.target.value)}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="rider-status">Initial Status</label>
                        <select 
                          id="rider-status" 
                          className={styles.formSelect}
                          value={newRiderStatus}
                          onChange={(e: any) => setNewRiderStatus(e.target.value)}
                        >
                          <option value="available">Available</option>
                          <option value="busy">Busy</option>
                          <option value="offline">Offline</option>
                        </select>
                      </div>

                      <button type="submit" disabled={submittingRider} className={styles.submitBtn} style={{ marginTop: '0.5rem' }}>
                        {submittingRider ? 'Adding Partner...' : 'Register Rider'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div>
                <h1 className={styles.tabHeading}>Manage Reservations</h1>
                <p className={styles.tabSubtitle}>Review and moderate guest dining reservations.</p>
                
                {reservations.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>No reservation requests logged yet.</div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.adminTable}>
                      <thead>
                        <tr>
                          <th>Guest Details</th>
                          <th>Phone & Email</th>
                          <th>Date & Time</th>
                          <th>Guests</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.map((res) => (
                          <tr key={res.id}>
                            <td style={{ fontWeight: '500', color: '#ffffff' }}>{res.name}</td>
                            <td>
                              <div style={{ fontSize: '0.85rem' }}>{res.phone}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.email}</div>
                            </td>
                            <td>
                              <div>{new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--primary-gold)' }}>{res.time}</div>
                            </td>
                            <td>{res.guests} Pax</td>
                            <td>
                              <span className={`${styles.badge} ${styles['badge-' + res.status]}`}>
                                {res.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {res.status === 'pending' && (
                                  <>
                                    <button 
                                      className={`${styles.actionBtn} ${styles.btnApprove}`}
                                      onClick={() => handleUpdateReservation(res.id, 'approved')}
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      className={`${styles.actionBtn} ${styles.btnCancel}`}
                                      onClick={() => handleUpdateReservation(res.id, 'cancelled')}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                <button 
                                  className={`${styles.actionBtn} ${styles.btnDelete}`}
                                  onClick={() => handleDeleteReservation(res.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div>
                <h1 className={styles.tabHeading}>Moderate Customer Reviews</h1>
                <p className={styles.tabSubtitle}>Moderate public review comments and ratings displayed on the website.</p>
                
                {reviews.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>No reviews submitted yet.</div>
                ) : (
                  <div className={styles.reviewsList}>
                    {reviews.map((rev) => (
                      <div 
                        key={rev.id} 
                        className={styles.moderationCard}
                        style={{ borderLeft: `4px solid ${rev.approved === 1 ? '#2eb872' : 'var(--primary-gold)'}` }}
                      >
                        <div className={styles.cardHeader}>
                          <div>
                            <h3 className={styles.reviewerName}>
                              {rev.author}
                              <span style={{ 
                                marginLeft: '10px', 
                                fontSize: '0.7rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                background: rev.approved === 1 ? 'rgba(46,184,114,0.1)' : 'rgba(223,160,50,0.1)',
                                color: rev.approved === 1 ? '#2eb872' : '#dfa032'
                              }}>
                                {rev.approved === 1 ? 'APPROVED' : 'PENDING'}
                              </span>
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Submitted on {new Date(rev.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.2rem', color: 'var(--primary-gold)' }}>
                            {Array.from({ length: rev.rating }).map((_, i) => <span key={i}>★</span>)}
                          </div>
                        </div>
                        <p className={styles.reviewComment}>{rev.comment}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                          {rev.approved !== 1 && (
                            <button 
                              className={`${styles.actionBtn} ${styles.btnApprove}`}
                              onClick={() => handleUpdateReview(rev.id, 1)}
                            >
                              Approve & Publish
                            </button>
                          )}
                          {rev.approved === 1 && (
                            <button 
                              className={`${styles.actionBtn} ${styles.btnCancel}`}
                              onClick={() => handleUpdateReview(rev.id, 0)}
                            >
                              Hide (Unpublish)
                            </button>
                          )}
                          <button 
                            className={`${styles.actionBtn} ${styles.btnDelete}`}
                            onClick={() => handleDeleteReview(rev.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MENU TAB */}
            {activeTab === 'menu' && (
              <div>
                <h1 className={styles.tabHeading}>Menu Availability Control</h1>
                <p className={styles.tabSubtitle}>Mark dishes as sold out or available dynamically based on kitchen stock.</p>
                
                <div className={styles.tableContainer}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Dish Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id} style={{ opacity: item.available ? 1 : 0.5 }}>
                          <td style={{ fontWeight: '500', color: '#ffffff' }}>{item.name}</td>
                          <td>{item.category}</td>
                          <td style={{ color: 'var(--primary-gold)', fontWeight: '600' }}>₹{item.price.toFixed(2)}</td>
                          <td>
                            <span className={`${styles.badge} ${item.available ? styles['badge-delivered'] : styles['badge-cancelled']}`}>
                              {item.available ? 'Available' : 'Sold Out'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className={`${styles.actionBtn} ${item.available ? styles.btnCancel : styles.btnApprove}`}
                              onClick={() => handleToggleMenuAvailability(item)}
                              style={{ minWidth: '120px' }}
                            >
                              {item.available ? 'Mark Sold Out' : 'Mark Available'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div>
                <h1 className={styles.tabHeading}>Analytics Dashboard</h1>
                <p className={styles.tabSubtitle}>Track your revenue trends and best-selling dishes.</p>
                
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                  {/* Revenue Chart */}
                  <div style={{ flex: '1 1 500px', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem' }}>7-Day Revenue Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="#ccc" />
                          <YAxis stroke="#ccc" />
                          <RechartsTooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                          <Legend />
                          <Line type="monotone" dataKey="Revenue" stroke="var(--primary-gold)" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Items Chart */}
                  <div style={{ flex: '1 1 500px', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: 'var(--primary-gold)', marginBottom: '1.5rem' }}>Top 5 Best Sellers</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={topItemsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="#ccc" />
                          <YAxis stroke="#ccc" />
                          <RechartsTooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                          <Legend />
                          <Bar dataKey="Sales" fill="#2eb872" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
