'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';
export default function Hero() {
  const [index, setIndex] = useState(0);
  const words = ["Энгийн", "Ухаалаг", "Хөнгөн", "Хэрэглэгч төвтэй", "Цэвэрхэн", "Дэгжин"];
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>UI/UX Дизайнер</span>
            <h1 className={styles.title} style={{ minHeight: '1.5em' }}>
            <span key={index} className={styles.rotatingText}>
              {words[index]}
            </span>
          </h1>
            <p className={styles.subtitle}>
              Би хэрэглэгч төвтэй, цэвэрхэн дизайн бүтээж, нарийн төвөгтэй асуудлыг 
              энгийн, дэгжин шийдэл болгон хувиргадаг. Веб болон мобайл интерфэйсээр 
              төрөлждөг.
            </p>
            <Link href="/projects" className={styles.cta}>
              Миний ажлууд
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
          <div className={styles.profileImageWrapper}>
            <Image
              src="/profile.jpg"
              alt="3D Abstract Design"
              width={400}
              height={400}
              className={styles.profileImage}
              priority
            />
          </div>
        </div>
      </div>
      <div className={`${styles.decorativeCircle} ${styles.circle1}`}></div>
      <div className={`${styles.decorativeCircle} ${styles.circle2}`}></div>
    </section>
  );
}
