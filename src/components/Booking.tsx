import { useState } from 'react';
import styles from './Booking.module.css';

export default function Booking() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: '2',
    occasion: 'Dining',
    special_requests: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        setStatus('success');
      } else {
        alert(data.error || 'Failed to submit reservation');
        setStatus('error');
      }
    } catch (err) {
      alert('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section id="booking" className={styles.bookingSection}>
      <div className={`container ${styles.content}`}>
        <div className={styles.titleBlock}>
          <span className="subtitle">Reserve Your Table</span>
          <h2 className={styles.heading}>Book Your Experience</h2>
        </div>

        {status === 'success' ? (
          <div className={`${styles.bookingCard} ${styles.successCard} animate-fade-in`}>
            <div className={styles.successIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className={styles.successTitle}>Reservation Requested</h3>
            <p className={styles.successText}>
              Thank you for choosing Swaad Rustam. Our concierge will contact you shortly to confirm your reservation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.bookingCard}>
            <div className={styles.grid}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" required className="form-input" placeholder="Your Name" value={formData.name} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" required className="form-input" placeholder="+91" value={formData.phone} onChange={handleChange} />
              </div>

              <div className="form-group fullWidth">
                <label>Email Address</label>
                <input type="email" name="email" required className="form-input" placeholder="your@email.com" value={formData.email} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" required className="form-input" value={formData.date} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Time</label>
                <select name="time" required className="form-input" value={formData.time} onChange={handleChange}>
                  <option value="">Select Time</option>
                  <option value="12:30 PM">12:30 PM</option>
                  <option value="1:00 PM">1:00 PM</option>
                  <option value="7:30 PM">7:30 PM</option>
                  <option value="8:00 PM">8:00 PM</option>
                  <option value="8:30 PM">8:30 PM</option>
                  <option value="9:00 PM">9:00 PM</option>
                </select>
              </div>

              <div className="form-group">
                <label>Number of Guests</label>
                <select name="guests" required className="form-input" value={formData.guests} onChange={handleChange}>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="5">5 Guests</option>
                  <option value="6">6+ Guests (Contact Us)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Occasion</label>
                <select name="occasion" className="form-input" value={formData.occasion} onChange={handleChange}>
                  <option value="Dining">Regular Dining</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Corporate">Corporate Gathering</option>
                </select>
              </div>

              <div className="form-group fullWidth">
                <label>Special Requests</label>
                <textarea name="special_requests" rows={3} className="form-input" placeholder="Any dietary restrictions or special requests?" value={formData.special_requests} onChange={handleChange}></textarea>
              </div>

              <div className={styles.submitBtn}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%' }}
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Processing...' : 'Reserve Your Experience'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

