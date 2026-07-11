import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swaad Rustam | Traditional Biryani & Pulao, Faridabad',
  description: 'Experience the legendary flavor of Swaad Rustam. Slow-cooked traditional Dum biryanis, aromatic pulaos, and tandoori kulchas in a premium ambiance at Radisson Blu Faridabad.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-playfair: 'Playfair Display', serif;
            --font-lato: 'Lato', sans-serif;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
