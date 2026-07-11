'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Cart, { CartItem } from '@/components/Cart';
import FloatingActions from '@/components/FloatingActions';
import styles from './menu-page.module.css';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
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

    // Fetch the TGKF menu items from database API
    fetch('/api/menu')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch menu');
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setItems(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
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
    setIsCartOpen(true);
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

  // Filter items by search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group items by categories
  const categories = ['Salad', 'Starter - Non-Vegetarian', 'Starter - Vegetarian', 'Main Course', 'Dessert'];

  const getCategoryDisplayTitle = (category: string) => {
    switch (category) {
      case 'Salad': return 'Refreshing Salad';
      case 'Starter - Non-Vegetarian': return 'Non-Vegetarian Starters';
      case 'Starter - Vegetarian': return 'Vegetarian Starters';
      case 'Main Course': return 'Royal Main Course';
      case 'Dessert': return 'Desserts of the Day';
      default: return category;
    }
  };

  const getCategorySubtitle = (category: string) => {
    switch (category) {
      case 'Salad': return 'FRESH & HEALTHY';
      case 'Starter - Non-Vegetarian': return 'FIERY TANDOOR STARTERS';
      case 'Starter - Vegetarian': return 'CLAY-OVEN VEGETARIAN DELIGHTS';
      case 'Main Course': return 'SLOW-COOKED ROYAL MAINS';
      case 'Dessert': return 'SWEET FINALE OF THE DAY';
      default: return 'OUR DELICACIES';
    }
  };

  return (
    <div className={styles.menuPage}>
      <Navbar cartCount={totalItemsCount} onCartClick={() => setIsCartOpen(true)} />

      {/* Hero Header */}
      <section className={styles.heroHeader}>
        {/* Soft Background Blobs */}
        <div className={styles.greenBlob} />
        <div className={styles.tanBlob} />

        {/* Floating Spice Doodles */}
        <svg className={styles.spiceDoodle1} width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 20 C30 40 30 70 50 85 C70 70 70 40 50 20 Z" stroke="var(--primary-orange)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3"/>
          <path d="M50 25 C38 42 38 68 50 80 C62 68 62 42 50 25 Z" stroke="var(--primary-green)" strokeWidth="1" opacity="0.25"/>
        </svg>
        <svg className={styles.spiceDoodle2} width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L50 85 M15 50 L85 50 M25 25 L75 75 M25 75 L75 25" stroke="var(--primary-orange)" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
          <circle cx="50" cy="50" r="10" stroke="var(--primary-green)" strokeWidth="1.5" opacity="0.3"/>
        </svg>

        <span className={styles.subtitle}>Taste the Legend</span>
        <h1 className={styles.title}>Menu of the Day</h1>
        <p className={styles.desc}>
          Savor our daily handpicked non-vegetarian and vegetarian masterpieces, cooked slowly in traditional tandoors and sealed clay pots.
        </p>

        {/* Search Box */}
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Search dishes, starters, mains, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <svg 
              className={styles.searchIcon} 
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
      </section>

      {/* Menu List Container */}
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loader}>Preparing the Royal Dum Feast...</div>
        ) : searchQuery !== '' ? (
          // Search Results View
          <div>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryTitle}>Search Results</h2>
              <div className={styles.categoryLine} />
            </div>
            
            {filteredItems.length === 0 ? (
              <div className={styles.noResults}>
                No dishes found matching your query. Try searching for "Kabab", "Biryani", "Paneer", or "Halwa".
              </div>
            ) : (
              <div className={styles.menuGrid}>
                {filteredItems.map(item => {
                  const cartItem = cartItems.find(i => i.id === item.id);
                  return (
                    <div key={item.id} className={styles.itemCard}>
                      <div 
                        className={styles.plateCircle} 
                        style={{ backgroundImage: `url(${item.image_url || '/images/hero-biryani.png'})` }}
                      />
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <p className={styles.itemDesc}>{item.description}</p>
                      
                      <div className={styles.cardFooter}>
                        <span className={styles.priceTag}>₹{item.price}</span>
                        {cartItem ? (
                          <div className={styles.qtyWidget}>
                            <button 
                              onClick={() => updateCartQuantity(item.id, cartItem.quantity - 1)}
                              className={styles.qtyBtn}
                            >
                              -
                            </button>
                            <span className={styles.qtyValue}>{cartItem.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.id, cartItem.quantity + 1)}
                              className={styles.qtyBtn}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                            className={styles.cartActionBtn}
                          >
                            Add +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Grouped Categories View
          categories.map(cat => {
            const catItems = items.filter(item => item.category === cat);
            if (catItems.length === 0) return null;

            return (
              <section key={cat} className={styles.categorySection}>
                <div className={styles.categoryHeaderGroup}>
                  <span className={styles.categorySubtitle}>{getCategorySubtitle(cat)}</span>
                  <div className={styles.categoryHeader}>
                    <h2 className={styles.categoryTitle}>{getCategoryDisplayTitle(cat)}</h2>
                    <div className={styles.categoryLine} />
                  </div>
                </div>

                <div className={styles.menuGrid}>
                  {catItems.map(item => {
                    const cartItem = cartItems.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className={styles.itemCard}>
                        <div 
                          className={styles.plateCircle} 
                          style={{ backgroundImage: `url(${item.image_url || '/images/hero-biryani.png'})` }}
                        />
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <p className={styles.itemDesc}>{item.description}</p>
                        
                        <div className={styles.cardFooter}>
                          <span className={styles.priceTag}>₹{item.price}</span>
                          {cartItem ? (
                            <div className={styles.qtyWidget}>
                              <button 
                                onClick={() => updateCartQuantity(item.id, cartItem.quantity - 1)}
                                className={styles.qtyBtn}
                              >
                                -
                              </button>
                              <span className={styles.qtyValue}>{cartItem.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.id, cartItem.quantity + 1)}
                                className={styles.qtyBtn}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                              className={styles.cartActionBtn}
                            >
                              Add +
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Decorative Wave Transition */}
      <div style={{ position: 'relative', height: '140px', background: 'var(--bg-light)', marginBottom: '-5px', zIndex: 5, overflow: 'hidden' }}>
        <svg viewBox="0 0 1440 140" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', fill: 'var(--bg-dark)' }} preserveAspectRatio="none">
          <path d="M0,90 C360,140 720,40 1080,100 C1260,120 1350,130 1440,90 L1440,140 L0,140 Z"></path>
        </svg>
        <svg viewBox="0 0 200 200" style={{ position: 'absolute', bottom: '-20px', left: '8%', width: '180px', height: '180px', fill: 'var(--bg-dark)', zIndex: 10 }}>
          <path d="M60,200 Q70,130 48,70 Q52,70 62,130 Q62,200 62,200 Z" />
          <path d="M90,200 Q95,140 112,90 Q116,90 98,140 Q92,200 92,200 Z" />
          <path d="M48,70 Q15,60 5,85 Q20,75 48,70 Z" />
          <path d="M48,70 Q25,40 30,15 Q40,40 48,70 Z" />
          <path d="M48,70 Q65,35 85,25 Q70,50 48,70 Z" />
          <path d="M48,70 Q80,65 95,85 Q75,75 48,70 Z" />
          <path d="M48,70 Q65,90 70,110 Q60,85 48,70 Z" />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-orange)', fontSize: '1.8rem', letterSpacing: '0.05em' }}>SWAAD RUSTAM</h3>
            <p style={{ color: 'var(--text-dark)', opacity: 0.85, lineHeight: '1.7', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              Experience the legendary heritage of slow-cooked Dum biryanis, aromatic clay-pot pulaos, and traditional clay-oven baked flatbreads.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h4 style={{ color: 'var(--primary-orange)', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>Opening Hours</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.85, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
              <li>Monday – Thursday: 12:30 PM – 11:30 PM</li>
              <li>Friday – Sunday: 12:30 PM – 12:00 AM</li>
            </ul>
          </div>
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
        </div>
      </footer>

      {/* Cart Drawer */}
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
      <FloatingActions />
    </div>
  );
}
