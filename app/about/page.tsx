'use client';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import { useYearsOfExperience } from '@/app/lib/experience';
import styles from './page.module.css';

const PRINCIPLES = [
  {
    title: 'Энгийн байдал',
    text: 'Илүүдлийг хасаж, хамгийн чухал зүйлийг тодорхой, ойлгомжтой харуулна.',
  },
  {
    title: 'Хэрэглэгч төвтэй',
    text: 'Шийдвэр бүрийг бодит хэрэглэгчийн хэрэгцээ, зан төлөвт тулгуурлан гаргана.',
  },
  {
    title: 'Бодит асуудлыг шийдэх',
    text: 'Дизайн зөвхөн гоё харагдах бус, тулгарч буй асуудлыг үр дүнтэй шийдэх ёстой.',
  },
];

export default function About() {
  const years = useYearsOfExperience();

  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Миний тухай"
          title={<>Зорилго, тэмүүлэлтэйгээр <span className="gradient-text">бүтээх нь</span></>}
        />

        <section className={styles.section}>
          <div className={`container ${styles.grid}`}>
            <Reveal className={styles.text}>
              <p className={styles.lead}>
                Сайн байна уу, намайг Төмөрсүх гэдэг. Би ойлгомжтой, харахад таатай дижитал туршлагыг бүтээхэд анхаардаг UI/UX дизайнер юм.
                Салбартаа {years} гаруй жил ажиллахдаа би олон төрлийн харилцагчидтай хамтран тэдний төсөөллийг бодит болгож ажилласан.
              </p>
              <p>
                Миний дизайны философи нь энгийн байдал болон хэрэглэгч төвтэй хандлагад тулгуурладаг. Сайн дизайн гэдэг нь зөвхөн харагдах байдлын тухай бус, харин бодит хүмүүст тулгарч буй бодит асуудлыг үр дүнтэй шийдвэрлэх ёстой гэж би үздэг.
              </p>
              <p>
                Би хэрэглэгчийн туршлагыг тэргүүнд тавьсан, орчин үеийн бөгөөд цэвэрхэн интерфэйс боловсруулах чиглэлээр мэргэшсэн.
              </p>
              <Link href="/contact" className={styles.cta}>
                Хамтран ажиллах
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </Reveal>

            <Reveal delay={150} className={styles.visual}>
              <div className={styles.glow} aria-hidden="true" />
              <div className={styles.frame}>
                <Image src="/about.jpg" alt="Төмөрсүх" width={500} height={500} className={styles.photo} />
              </div>
              <div className={styles.badge}>
                <strong>{years}+</strong>
                <span>жилийн туршлага</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <Reveal y={16}>
              <span className="eyebrow">Зарчим</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className={styles.heading}>
                Миний <span className="gradient-text">хандлага</span>
              </h2>
            </Reveal>
            <div className={styles.principles}>
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.title} delay={i * 110} className={styles.principle}>
                  <span className={styles.principleIndex}>0{i + 1}</span>
                  <h3 className={styles.principleTitle}>{p.title}</h3>
                  <p className={styles.principleText}>{p.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
