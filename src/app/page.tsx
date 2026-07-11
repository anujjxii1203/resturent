'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Features from '@/components/Features';
import Gallery from '@/components/Gallery';
import Reviews from '@/components/Reviews';
import Booking from '@/components/Booking';
import FloatingActions from '@/components/FloatingActions';
import Cart, { CartItem } from '@/components/Cart';

export default function Home() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tgkf_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync cart to localStorage
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('tgkf_cart', JSON.stringify(items));
  };

  const addToCart = (item: { id: number; name: string; price: number }) => {
    const existing = cartItems.find(i => i.id === item.id);
    let newItems;
    if (existing) {
      newItems = cartItems.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...cartItems, { ...item, quantity: 1 }];
    }
    saveCart(newItems);
    setIsCartOpen(true); // Open drawer immediately on add to cart
  };

  const updateCartQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const newItems = cartItems.map(item => 
      item.id === id ? { ...item, quantity } : item
    );
    saveCart(newItems);
  };

  const removeFromCart = (id: number) => {
    const newItems = cartItems.filter(item => item.id !== id);
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Navbar cartCount={totalItemsCount} onCartClick={() => setIsCartOpen(true)} />
      
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Hero addToCart={addToCart} />

        <Features />
        <Gallery />
        <Reviews />
        <Booking />
        <About />
      </main>

      {/* Wave Transition with Palm Tree Silhouettes matching the design image */}
      <div style={{ position: 'relative', height: '140px', background: 'var(--bg-light)', marginBottom: '-5px', zIndex: 5, overflow: 'hidden' }}>
        <svg viewBox="0 0 1440 140" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', fill: 'var(--bg-dark)' }} preserveAspectRatio="none">
          <path d="M0,90 C360,140 720,40 1080,100 C1260,120 1350,130 1440,90 L1440,140 L0,140 Z"></path>
        </svg>
        {/* Palm Trees silhouette on the left */}
        <svg viewBox="0 0 200 200" style={{ position: 'absolute', bottom: '-20px', left: '8%', width: '180px', height: '180px', fill: 'var(--bg-dark)', zIndex: 10 }}>
          {/* Palm tree trunks */}
          <path d="M60,200 Q70,130 48,70 Q52,70 62,130 Q62,200 62,200 Z" />
          <path d="M90,200 Q95,140 112,90 Q116,90 98,140 Q92,200 92,200 Z" />
          {/* Palm leaves tree 1 */}
          <path d="M48,70 Q15,60 5,85 Q20,75 48,70 Z" />
          <path d="M48,70 Q25,40 30,15 Q40,40 48,70 Z" />
          <path d="M48,70 Q65,35 85,25 Q70,50 48,70 Z" />
          <path d="M48,70 Q80,65 95,85 Q75,75 48,70 Z" />
          <path d="M48,70 Q65,90 70,110 Q60,85 48,70 Z" />
          {/* Palm leaves tree 2 */}
          <path d="M112,90 Q85,80 75,100 Q90,90 112,90 Z" />
          <path d="M112,90 Q95,60 100,40 Q105,65 112,90 Z" />
          <path d="M112,90 Q127,60 147,55 Q132,75 112,90 Z" />
          <path d="M112,90 Q137,85 152,105 Q132,95 112,90 Z" />
          <path d="M112,90 Q122,110 127,130 Q117,105 112,90 Z" />
        </svg>
      </div>

      {/* Footer */}
      <footer 
        style={{
          background: 'var(--primary-green-muted)',
          borderTop: '1px solid var(--border-green)',
          padding: '4rem 0 3rem 0',
          color: 'var(--text-dark)',
          fontSize: '0.9rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          {/* Logo / Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-orange)', fontSize: '1.8rem', letterSpacing: '0.05em' }}>SWAAD RUSTAM</h3>
            <p style={{ color: 'var(--text-dark)', opacity: 0.85, lineHeight: '1.7', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              Experience the legendary heritage of slow-cooked Dum biryanis, aromatic clay-pot pulaos, and traditional clay-oven baked flatbreads.
            </p>
          </div>

          {/* Opening Hours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h4 style={{ color: 'var(--primary-orange)', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>Opening Hours</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.85, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              <li>Monday – Thursday: 12:30 PM – 11:30 PM</li>
              <li>Friday – Sunday: 12:30 PM – 12:00 AM</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h4 style={{ color: 'var(--primary-orange)', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>Contact</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.85, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              <li>Radisson Blu Hotel, 40 Krishna Nagar</li>
              <li>Faridabad, Haryana 121007</li>
              <li>Phone: +91 99991 26201</li>
            </ul>
          </div>
        </div>

        <div className="container" style={{ borderTop: '1px solid var(--border-green)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ opacity: 0.7 }}>&copy; {new Date().getFullYear()} Swaad Rustam. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.7 }}>
            <a href="#about" style={{ transition: 'color 0.3s' }}>Privacy Policy</a>
            <a href="#about" style={{ transition: 'color 0.3s' }}>Terms of Service</a>
          </div>
        </div>
      </footer>
      
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
      <FloatingActions />
    </>
  );
}
