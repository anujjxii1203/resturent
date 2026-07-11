'use client';

import { useState, useEffect } from 'react';
import styles from './Hero.module.css';

interface HeroProps {
  addToCart: (item: { id: number; name: string; price: number }) => void;
}

const slides = [
  {
    id: 1,
    name: 'Mattbor Biryani',
    price: 1590,
    tagline: 'ESTD. 2002 — ₹1590',
    title: 'Mattbor Biryani',
    description: 'A flavorful blend of aromatic spices and tender meat, cooked to perfection using traditional recipes. Slow-cooked in a sealed clay pot to lock in the rich, authentic heritage.',
    image: '/images/hero-biryani.png'
  },
  {
    id: 4,
    name: 'Gondhoraj Chicken Pulao',
    price: 850,
    tagline: 'POPULAR CHOICE — ₹850',
    title: 'Gondhoraj Pulao',
    description: 'Aromatic basmati rice cooked with tender chicken and infused with the refreshing, signature fragrance of Gondhoraj lime leaves and green chillies.',
    image: '/images/gondhoraj-pulao.png'
  },
  {
    id: 3,
    name: 'Creamy Tandoori Kulcha',
    price: 320,
    tagline: 'MUST TRY — ₹320',
    title: 'Tandoori Kulcha',
    description: 'Soft, pillowy clay-oven baked flatbread stuffed with cottage cheese, glazed with fresh butter and served hot.',
    image: '/images/kulcha.png'
  },
  {
    id: 7,
    name: 'Traditional Sweet Lassi',
    price: 250,
    tagline: 'REFRESHING — ₹250',
    title: 'Sweet Lassi',
    description: 'Thick, creamy yogurt drink blended with cardamoms and rose water, served chilled in a traditional clay pot.',
    image: '/images/sweet-lassi.png'
  }
];

export default function Hero({ addToCart }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Function to switch slides with a smooth cross-fade
  const changeSlide = (nextIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Fade out first
    setTimeout(() => {
      setCurrentSlide(nextIndex);
      setIsTransitioning(false);
    }, 600); // Matches transition duration in Hero.module.css (600ms)
  };

  // Auto slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentSlide + 1) % slides.length;
      changeSlide(nextIndex);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentSlide, isTransitioning]);

  const slide = slides[currentSlide];

  const handleOrder = () => {
    addToCart({
      id: slide.id,
      name: slide.name,
      price: slide.price
    });
  };

  const handleDotClick = (index: number) => {
    if (index === currentSlide) return;
    changeSlide(index);
  };

  return (
    <section id="home" className={styles.heroSection}>
      <div className={`${styles.gridContainer} ${isTransitioning ? styles.transitioning : ''}`}>
        {/* Left Column: Description Details */}
        <div className={styles.infoColumn}>
          <span className={styles.estdTag}>{slide.tagline}</span>
          <h1 className={styles.mainTitle}>{slide.title}</h1>
          <p className={styles.description}>{slide.description}</p>

          <button className={styles.orderBtn} onClick={handleOrder}>
            <span>Order Now</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right Column: Thali Frame */}
        <div className={styles.imageColumn}>
          <div className={styles.thaliFrame}>
            <div
              className={styles.thaliImage}
              style={{
                backgroundImage: `url('${slide.image}')`
              }}
            />
          </div>
        </div>
      </div>

      {/* Slider Indicators (dots) */}
      <div className={styles.dotContainer}>
        {slides.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
