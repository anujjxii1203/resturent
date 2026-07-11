'use client';

import { useEffect, useState } from 'react';
import styles from './Menu.module.css';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface MenuProps {
  addToCart: (item: { id: number; name: string; price: number }) => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
}

export default function Menu({ addToCart, cartItems, onUpdateQuantity }: MenuProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/menu')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setItems(data.data);
        } else if (data && Array.isArray(data.items)) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        // Fallback static items matching the TGKF menu
        setItems([
          { id: 1, name: 'TGKF Classical Salad', description: 'Fresh garden greens, cucumber, carrots, tomatoes, and red onions with a touch of lime juice and chaat masala.', price: 350, category: 'Salad', image_url: '/images/classical-salad.png' },
          { id: 2, name: 'Galouti Kabab', description: 'Legendary melt-in-the-mouth minced lamb patties seasoned with over 150 spices, smoked and cooked on a mahi-tawa.', price: 890, category: 'Starter - Non-Vegetarian', image_url: '/images/galouti-kabab.png' },
          { id: 3, name: 'Changezi Tangdi', description: 'Tandoor cooked chicken drumsticks marinated in a rich, creamy, and spicy orange Lucknowi marinade.', price: 790, category: 'Starter - Non-Vegetarian', image_url: '/images/changezi-tangdi.png' },
          { id: 8, name: 'Murgh Dum Biryani', description: 'Aromatic long-grain Basmati rice cooked with succulent chicken pieces, saffron, and mint leaves, slow-cooked in a sealed pot.', price: 950, category: 'Main Course', image_url: '/images/murgh-biryani.png' },
          { id: 9, name: 'Subz Galouti Kabab', description: 'Melt-in-the-mouth vegetarian galouti patties made from finely minced yam and local farm greens, flavored with aromatic spices.', price: 690, category: 'Starter - Vegetarian', image_url: '/images/subz-galouti.png' },
          { id: 10, name: 'Surkh Paneer Tikka', description: 'Fresh cottage cheese blocks marinated in a vibrant red chilli and spice paste, skewered and baked in the tandoor.', price: 680, category: 'Starter - Vegetarian', image_url: '/images/kesari-murgh.png' },
          { id: 15, name: 'Subz Dum Biryani', description: 'Richly layered Basmati rice cooked with fresh seasonal vegetables, paneer cubes, saffron strands, and fresh mint.', price: 750, category: 'Main Course', image_url: '/images/gondhoraj-pulao.png' }
        ]);
        setLoading(false);
      });
  }, []);

  // Filter items by search query
  const filteredSearchItems = items.filter(item => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           item.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getFeatures = (name: string): string[] => {
    switch (name) {
      case 'Galouti Kabab':
        return ['Melt-in-mouth', 'Mahi Tawa Cooked', '150+ Royal Spices', 'Rich Lamb'];
      case 'Murgh Dum Biryani':
        return ['Long-Grain Basmati', 'Aromatic Dum Cooked', 'Tender Chicken', 'Saffron Layered'];
      case 'Subz Dum Biryani':
        return ['Aromatic Saffron', 'Fresh Vegetables', 'Rich Paneer Cubes', 'Slow Cooked'];
      case 'Surkh Paneer Tikka':
        return ['Fresh Cottage Cheese', 'Tandoor Grilled', 'Vibrant Marinade', 'Clay Oven Baked'];
      default:
        return ['100% Quality', 'Fresh Spices', 'Chef Special', 'Traditional'];
    }
  };

  const getBadge = (name: string): string => {
    if (name.includes('Biryani')) return 'MUST TRY';
    if (name.includes('Kulcha')) return 'POPULAR';
    if (name.includes('Pulao')) return 'NEW';
    return 'DISH';
  };

  // Divide items into sections dynamically based on new TGKF menu items
  const specialItems = items.filter(item => 
    item.name === 'Galouti Kabab' || 
    item.name === 'Murgh Dum Biryani' || 
    item.name === 'Subz Dum Biryani' ||
    item.name === 'Surkh Paneer Tikka'
  );
  const otherItems = items.filter(item => 
    item.name !== 'Galouti Kabab' && 
    item.name !== 'Murgh Dum Biryani' && 
    item.name !== 'Subz Dum Biryani' &&
    item.name !== 'Surkh Paneer Tikka'
  );

  return (
    <section id="menu" className={styles.menuSection}>
      <div className="container">
        
        {/* Search Bar section */}
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <input 
              id="menu-search-input"
              type="text" 
              placeholder="Search biryanis, sides, or drinks..."
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

        {loading ? (
          <div className={styles.loader}>Preparing the Royal Dum Biryani Feast...</div>
        ) : searchQuery !== '' ? (
          // Search Results View
          <div>
            <div className={styles.header}>
              <span className={styles.subtitle}>Results</span>
              <h2 className={styles.title}>Search Results</h2>
              <p className={styles.desc}>Showing dishes matching "{searchQuery}"</p>
            </div>
            
            {filteredSearchItems.length === 0 ? (
              <div className={styles.noResults}>
                No dishes found. Try searching for "Biryani", "Kulcha", or "Lassi".
              </div>
            ) : (
              <div className={styles.choicesGrid}>
                {filteredSearchItems.map(item => {
                  const cartItem = cartItems.find(i => i.id === item.id);
                  return (
                    <div key={item.id} className={styles.choiceCard}>
                      <div 
                        className={styles.choicePlate} 
                        style={{ backgroundImage: `url(${item.image_url || '/images/hero-biryani.png'})` }}
                      />
                      <h3 className={styles.choiceTitle}>{item.name}</h3>
                      <p className={styles.choiceDesc}>{item.description}</p>
                      
                      <div className={styles.choiceFooter}>
                        <span className={styles.choicePrice}>₹{item.price}</span>
                        {cartItem ? (
                          <div className={styles.qtyWidget}>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, cartItem.quantity - 1)}
                              className={styles.qtyBtn}
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className={styles.qtyValue}>{cartItem.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, cartItem.quantity + 1)}
                              className={styles.qtyBtn}
                              aria-label="Increase quantity"
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
          // Default Layout: Rustam Special & More Food Choices
          <div>
            {/* SECTION 1: Rustam Special */}
            <div className={styles.header}>
              <span className={styles.subtitle}>Rustam Biryani</span>
              <h2 className={styles.title}>Rustam Special</h2>
              <p className={styles.desc}>
                Handcrafted local favorites slow-cooked under steam (Dum) using premium basmati rice and signature ground spices.
              </p>
            </div>

            <div className={styles.specialGrid}>
              {specialItems.map(item => {
                const cartItem = cartItems.find(i => i.id === item.id);
                const features = getFeatures(item.name);
                
                return (
                  <div key={item.id} className={styles.specialCard}>
                    <span className={styles.badge}>{getBadge(item.name)}</span>
                    <div 
                      className={styles.plateCircle} 
                      style={{ backgroundImage: `url(${item.image_url || '/images/hero-biryani.png'})` }}
                    />
                    
                    {/* Stars */}
                    <div className={styles.ratingRow}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={styles.star} width="14" height="14" viewBox="0 0 24 24">
                          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                        </svg>
                      ))}
                    </div>

                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemDesc}>{item.description}</p>
                    
                    {/* Features list */}
                    <div className={styles.featuresList}>
                      {features.map((feat, idx) => (
                        <div key={idx} className={styles.featureItem}>
                          <svg className={styles.checkIcon} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.priceTag}>₹{item.price}</span>
                      {cartItem ? (
                        <div className={styles.qtyWidget}>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, cartItem.quantity - 1)}
                            className={styles.qtyBtn}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className={styles.qtyValue}>{cartItem.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, cartItem.quantity + 1)}
                            className={styles.qtyBtn}
                            aria-label="Increase quantity"
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

            {/* SECTION 2: More Food Choices */}
            <div className={styles.sectionDivider}>
              <div className={styles.dividerLine} />
              <h2 className={styles.dividerTitle}>More Food Choices</h2>
              <div className={styles.dividerLine} />
            </div>

            <div className={styles.choicesGrid}>
              {otherItems.map(item => {
                const cartItem = cartItems.find(i => i.id === item.id);
                return (
                  <div key={item.id} className={styles.choiceCard}>
                    <div 
                      className={styles.choicePlate} 
                      style={{ backgroundImage: `url(${item.image_url || '/images/hero-biryani.png'})` }}
                    />
                    <h3 className={styles.choiceTitle}>{item.name}</h3>
                    <p className={styles.choiceDesc}>{item.description}</p>
                    
                    <div className={styles.choiceFooter}>
                      <span className={styles.choicePrice}>₹{item.price}</span>
                      {cartItem ? (
                        <div className={styles.qtyWidget}>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, cartItem.quantity - 1)}
                            className={styles.qtyBtn}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className={styles.qtyValue}>{cartItem.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, cartItem.quantity + 1)}
                            className={styles.qtyBtn}
                            aria-label="Increase quantity"
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

          </div>
        )}

      </div>
    </section>
  );
}
