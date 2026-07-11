import styles from './Features.module.css';

export default function Features() {
  const features = [
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2c0 0-4 4-4 9a4 4 0 0 0 8 0c0-5-4-9-4-9z"/><path d="M12 12s-1 1-1 2 1 2 1 2 1-1 1-2-1-2z"/></svg>, 
      title: 'Endless Kebab Service', 
      desc: 'Savor unlimited servings of our signature kebabs brought straight to your table.' 
    },
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>, 
      title: 'Authentic Traditional Recipes', 
      desc: 'Crafted using age-old recipes, secret spices, and traditional Awadhi techniques.' 
    },
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M10 9h.01"/><path d="M14 9h.01"/><path d="M10 13h.01"/><path d="M14 13h.01"/></svg>, 
      title: 'Luxury Ambience', 
      desc: 'A premium, elegant atmosphere inspired by royal Mughal heritage and modern luxury.' 
    },
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m2 22 5-5"/><path d="m22 2-5 5"/><path d="m22 22-5-5"/><path d="m2 2 5 5"/><path d="m10 10 4 4"/><path d="m14 10-4 4"/></svg>, 
      title: 'Perfect For Celebrations', 
      desc: 'Host your special moments with our impeccable service and majestic dining setups.' 
    },
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, 
      title: 'Family Friendly Dining', 
      desc: 'A warm and welcoming environment for families to feast and bond over great food.' 
    },
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>, 
      title: 'Corporate Gatherings', 
      desc: 'Impress your clients and colleagues with an exclusive fine-dining corporate experience.' 
    }
  ];

  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.header}>
          <span className="subtitle">Why Guests Love Us</span>
          <h2 className={styles.heading}>The Great Experience</h2>
        </div>

        <div className={styles.grid}>
          {features.map((feature, idx) => (
            <div key={idx} className={`${styles.card} glass-panel`}>
              <div className={styles.iconWrapper}>{feature.icon}</div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
