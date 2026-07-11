import styles from './Gallery.module.css';

export default function Gallery() {
  const images = [
    { id: 1, path: '/images/gallery-interior-1.png', category: 'Restaurant Interiors', title: 'TGKF Main Seating' },
    { id: 2, path: '/images/gallery-interior-2.png', category: 'Dining Ambience', title: 'Warm Ambience Seating' },
    { id: 3, path: '/images/gallery-food-3.png', category: 'Signature Kebabs', title: 'Charcoal Skewer Kebabs' },
    { id: 4, path: '/images/gallery-food-2.png', category: 'Signature Kebabs', title: 'Fiery Tandoori Drumsticks' },
    { id: 5, path: '/images/gallery-interior-3.png', category: 'Premium Dining Setup', title: 'Gourmet Table Layout' },
    { id: 6, path: '/images/gallery-menu.png', category: 'Food & Drinks', title: 'Fine Dining Table Setting' },
    { id: 7, path: '/images/gallery-interior-4.png', category: 'Dining Ambience', title: 'Cozy Dining Seating' },
    { id: 8, path: '/images/gallery-food-1.png', category: 'Food & Drinks', title: 'Traditional Kebab Feast' },
    { id: 9, path: '/images/gallery-interior-6.png', category: 'Restaurant Interiors', title: 'Upscale Dining Lounge' }
  ];

  return (
    <section className={styles.gallerySection}>
      <div className="container">
        <div className={styles.header}>
          <span className="subtitle">Photo Gallery</span>
          <h2 className={styles.heading}>A Glimpse Into The Experience</h2>
        </div>

        <div className={styles.masonry}>
          {images.map((img) => (
            <div key={img.id} className={styles.galleryItem}>
              <div 
                className={styles.imageBox}
                style={{
                  backgroundImage: `url('${img.path}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                role="img"
                aria-label={img.title}
              />
              <div className={styles.overlay}>
                <span className={styles.overlayText}>{img.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
