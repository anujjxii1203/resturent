'use client';

import { useState } from 'react';
import styles from './About.module.css';

export default function About() {
  const [activeTab, setActiveTab] = useState('faridabad');

  return (
    <section id="about" className={styles.locationSection}>
      <div className="container">

        {/* Section Heading */}
        <h2 className={styles.sectionHeading}>VISIT OUR RADISSON BLU LOCATION</h2>

        {/* Location Tabs Slider */}
        <div className={styles.tabWrapper}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'faridabad' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('faridabad')}
          >
            Radisson Blu, Faridabad
          </button>
        </div>

        {/* Location Details Container */}
        {activeTab === 'faridabad' && (
          <div className={styles.detailsGrid}>

            {/* Left Column: Delivery Scooter Graphic */}
            <div className={styles.scooterCol}>
              <svg className={styles.scooterSvg} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Back Wheel */}
                <circle cx="28" cy="72" r="10" fill="#150f0f" stroke="#E68A00" strokeWidth="3" />
                <circle cx="28" cy="72" r="4" fill="#E68A00" />
                {/* Front Wheel */}
                <circle cx="72" cy="72" r="10" fill="#150f0f" stroke="#E68A00" strokeWidth="3" />
                <circle cx="72" cy="72" r="4" fill="#E68A00" />
                {/* Main Scooter Body */}
                <path d="M28 72 H52 L62 45 H72" stroke="#150f0f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M52 72 L52 45 H32 V33 H24" stroke="#150f0f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M72 72 L66 45 L64 33 H58" stroke="#150f0f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {/* Delivery Box - Marigold Saffron */}
                <rect x="18" y="34" width="22" height="22" rx="3" fill="#E68A00" stroke="#150f0f" strokeWidth="3" />
                {/* Delivery cross line on box */}
                <path d="M24 45 H34 M29 40 V50" stroke="#FAF8F5" strokeWidth="2.5" strokeLinecap="round" />
                {/* Seat */}
                <rect x="44" y="41" width="14" height="4" rx="2" fill="#D35400" stroke="#150f0f" strokeWidth="2" />
                {/* Front Headlight */}
                <circle cx="68" cy="33" r="3" fill="#FFE066" stroke="#150f0f" strokeWidth="2" />
                {/* Smoke Bubbles */}
                <circle cx="10" cy="74" r="3" fill="rgba(0,0,0,0.15)" />
                <circle cx="5" cy="76" r="2" fill="rgba(0,0,0,0.1)" />
              </svg>
              <div className={styles.scooterText}>Endless Kebab Delivery</div>
            </div>

            {/* Middle Column: Operating Hours & Contact */}
            <div className={styles.infoCol}>
              <h3 className={styles.locationTitle}>RADISSON BLU</h3>
              <p className={styles.address}>
                Sector 20, Krishna Nagar<br />
                Opposite Bata Chowk Metro Station,<br />
                Faridabad, Haryana 121007
              </p>

              <div className={styles.metaBlock}>
                <h4 className={styles.metaLabel}>HOURS OF OPERATION</h4>
                <p className={styles.metaVal}>
                  Mon - Thu: 12:30pm - 11:30pm<br />
                  Fri - Sun: 12:30pm - 12:00am
                </p>
              </div>

              <div className={styles.metaBlock}>
                <h4 className={styles.metaLabel}>RESERVATIONS & HELPLINE</h4>
                <a href="tel:+919999126201" className={styles.phoneLink}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  +91 99991 26201
                </a>
              </div>
            </div>

            {/* Right Column: Mini Map View */}
            <div className={styles.mapCol}>
              <div className={styles.mapCard}>
                <div className={styles.mapVisual}>
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.7046200251787!2d77.3095900762283!3d28.39798037579346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdd22ac4936c1%3A0xf79ef9458149c1d5!2sThe%20Great%20Kebab%20Factory%20-%20Faridabad!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Radisson Blu Faridabad Map Location"
                  ></iframe>
                </div>
                <a
                  href="https://maps.google.com/?q=The+Great+Kebab+Factory+Radisson+Blu+Faridabad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapDirectionBtn}
                >
                  GET DIRECTIONS
                </a>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
