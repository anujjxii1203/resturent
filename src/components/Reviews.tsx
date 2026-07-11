'use client';

import { useState, useEffect } from 'react';
import styles from './Reviews.module.css';

interface Review {
  author: string;
  comment: string;
  rating: number;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isWriting, setIsWriting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formData, setFormData] = useState({ author: '', rating: '5', comment: '' });

  useEffect(() => {
    // Fetch reviews from API
    fetch('/api/reviews')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setReviews(data.data);
        } else if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
        } else {
          // Fallback reviews
          setReviews([
            { author: 'Rahul S.', comment: 'The Mattbor Biryani is an absolute masterpiece. The meat was unbelievably tender and the fragrance of saffron was incredible!', rating: 5 },
            { author: 'Anjali M.', comment: 'Amazing texture and perfect blend of spices. The Gondhoraj Chicken Pulao is so fresh and unique. Highly recommended!', rating: 5 },
            { author: 'Vikram K.', comment: 'Easily the best Biryani in town. The clay-pot presentation and warm, heritage-filled ambiance make it a luxury experience.', rating: 5 }
          ]);
        }
      })
      .catch(() => {
        setReviews([
          { author: 'Rahul S.', comment: 'The Mattbor Biryani is an absolute masterpiece. The meat was unbelievably tender and the fragrance of saffron was incredible!', rating: 5 },
          { author: 'Anjali M.', comment: 'Amazing texture and perfect blend of spices. The Gondhoraj Chicken Pulao is so fresh and unique. Highly recommended!', rating: 5 },
          { author: 'Vikram K.', comment: 'Easily the best Biryani in town. The clay-pot presentation and warm, heritage-filled ambiance make it a luxury experience.', rating: 5 }
        ]);
      });
  }, []);

  // Cycle reviews
  useEffect(() => {
    if (reviews.length <= 1 || isWriting) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [reviews, isWriting]);

  const activeReview = reviews[currentIndex];

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          setIsWriting(false);
          setSubmitStatus('idle');
          setFormData({ author: '', rating: '5', comment: '' });
        }, 3000);
      } else {
        alert(data.error || 'Failed to submit review');
        setSubmitStatus('idle');
      }
    } catch (err) {
      alert('Network error submitting review');
      setSubmitStatus('idle');
    }
  };

  return (
    <section id="reviews" className={styles.reviewsSection}>
      <div className="container">
        <div className={styles.storyGrid}>
          
          {/* Left Column: Polaroid Collage */}
          <div className={styles.collageCol}>
            {/* Polaroid 1 (Base/Back) */}
            <div className={`${styles.polaroid} ${styles.polaroid1}`}>
              <div 
                className={styles.polaroidImg}
                style={{ backgroundImage: "url('/images/ghee-rice.png')" }}
              />
              <div className={styles.polaroidCaption}>Dining Room</div>
            </div>

            {/* Polaroid 2 (Middle) */}
            <div className={`${styles.polaroid} ${styles.polaroid2}`}>
              <div 
                className={styles.polaroidImg}
                style={{ backgroundImage: "url('/images/kulcha.png')" }}
              />
              <div className={styles.polaroidCaption}>Clay Pot Cooking</div>
            </div>

            {/* Polaroid 3 (Front/Top) */}
            <div className={`${styles.polaroid} ${styles.polaroid3}`}>
              <div 
                className={styles.polaroidImg}
                style={{ backgroundImage: "url('/images/hero-biryani.png')" }}
              />
              <div className={styles.polaroidCaption}>Signature Biryani</div>
            </div>
          </div>

          {/* Right Column: Narrative Story & Testimonials */}
          <div className={styles.contentCol}>
            <span className={styles.storySubtitle}>Swaad Rustam Tradition</span>
            <h2 className={styles.storyHeading}>
              TRADITIONAL BIRYANI THAT FARIDABAD LOVES
            </h2>
            <p className={styles.storyText}>
              Swaad Rustam is the city's legendary dining destination for authentic Indian heritage. We bring you an endless celebration of slow-cooked Dum biryanis, handpicked spices, and traditional tandoori breads cooked using age-old ancestral techniques. 
            </p>
            <p className={styles.storyText}>
              Every biryani is prepared fresh from scratch in our kitchens, using premium long-grain Basmati rice, farm-fresh ingredients, and our chef's secret blend of house-ground spices, ensuring rich flavor and a deep, inviting aroma.
            </p>

            {isWriting ? (
              <div className={styles.quoteCard} style={{ textAlign: 'left' }}>
                {submitStatus === 'success' ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <h3 style={{ color: 'var(--primary-gold)', marginBottom: '1rem' }}>Thank You!</h3>
                    <p>Your review has been submitted for moderation.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary-gold)' }}>Share Your Experience</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      <input 
                        type="text" 
                        required 
                        placeholder="Your Name" 
                        className="form-input" 
                        value={formData.author}
                        onChange={e => setFormData({...formData, author: e.target.value})}
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <select 
                        required 
                        className="form-input"
                        value={formData.rating}
                        onChange={e => setFormData({...formData, rating: e.target.value})}
                      >
                        <option value="5">5 Stars - Excellent</option>
                        <option value="4">4 Stars - Very Good</option>
                        <option value="3">3 Stars - Average</option>
                        <option value="2">2 Stars - Poor</option>
                        <option value="1">1 Star - Terrible</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <textarea 
                        required 
                        placeholder="Your Review" 
                        rows={3} 
                        className="form-input"
                        value={formData.comment}
                        onChange={e => setFormData({...formData, comment: e.target.value})}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="button" className="btn-secondary" onClick={() => setIsWriting(false)}>Cancel</button>
                      <button type="submit" className="btn-primary" disabled={submitStatus === 'submitting'}>
                        {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              activeReview && (
                <div className={styles.quoteCard}>
                  <div className={styles.stars}>
                    {[...Array(activeReview.rating)].map((_, i) => (
                      <svg key={i} className={styles.starIcon} viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p className={styles.quoteComment}>
                    "{activeReview.comment}"
                  </p>
                  <h4 className={styles.quoteAuthor}>- {activeReview.author}</h4>
                  
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => setIsWriting(true)}
                    >
                      Write a Review
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

