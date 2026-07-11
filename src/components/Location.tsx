import styles from './Location.module.css';

export default function Location() {
  return (
    <section id="location" className={styles.locationSection}>
      <div className={styles.mapContainer}>
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3509.7046200251787!2d77.3095900762283!3d28.39798037579346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdd22ac4936c1%3A0xf79ef9458149c1d5!2sThe%20Great%20Kebab%20Factory%20-%20Faridabad!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen={true} 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="The Great Kebab Factory Faridabad Map Location"
        ></iframe>
      </div>
    </section>
  );
}
