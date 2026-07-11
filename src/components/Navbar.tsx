'use client';

import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>
        {/* Left Side: Logo */}
        <div className={styles.logoContainer}>
          <a href="/" className={styles.logoText}>
            Swaad
            <span className={styles.logoSubtext}>RUSTAM & BIRYANI</span>
          </a>
        </div>

        {/* Center: Navigation Links */}
        <div className={styles.middleMenu}>
          <a href="/" className={styles.navLink}>Home</a>
          <a href="/menu" className={styles.navLink}>Our Menu</a>
          <a href="/#about" className={styles.navLink}>About Us</a>
          <a href="/#reviews" className={styles.navLink}>Reviews</a>
        </div>

        {/* Right Side: Actions (Cart & Table Booking) */}
        <div className={styles.rightMenu}>
          <button onClick={onCartClick} className={styles.cartButton} aria-label="Open cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Cart ({cartCount})</span>
          </button>
          
          <a href="/#booking" className={styles.reserveBtn}>
            Book Table
          </a>
        </div>

        {/* Mobile Toggle & Actions */}
        <div className={styles.mobileRight}>
          <button onClick={onCartClick} className={styles.cartButtonMobileSmall} aria-label="Open cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className={styles.mobileCartBadge}>{cartCount}</span>
          </button>
          
          <button 
            className={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="28" height="28">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: scrolled ? '75px' : '90px',
            left: 0,
            right: 0,
            background: 'var(--bg-light)',
            borderBottom: '1px solid var(--border-green)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 2rem',
            gap: '1.2rem',
            zIndex: 99
          }}
          className="animate-slide-up"
        >
          <a href="/" onClick={() => setMobileMenuOpen(false)} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>Home</a>
          <a href="/menu" onClick={() => setMobileMenuOpen(false)} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>Our Menu</a>
          <a href="/#about" onClick={() => setMobileMenuOpen(false)} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>About Us</a>
          <a href="/#reviews" onClick={() => setMobileMenuOpen(false)} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>Reviews</a>
          <a href="/#booking" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--primary-orange)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', fontWeight: 'bold' }}>Book Table</a>
        </div>
      )}
    </header>
  );
}
