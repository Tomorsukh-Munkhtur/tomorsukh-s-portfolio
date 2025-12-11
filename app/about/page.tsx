'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function About() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '8rem', paddingBottom: '5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '1rem' }}>Миний тухай</span>
              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem' }}>Зорилго, тэмүүлэлтэйгээр бүтээх нь</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                Сайн байна уу, намайг Төмөрсүх гэдэг. Би ойлгомжтой, харахад таатай дижитал туршлагыг бүтээхэд анхаардаг UI/UX дизайнер юм.
                Салбартаа 5 гаруй жил ажиллахдаа би олон төрлийн харилцагчидтай хамтран тэдний төсөөллийг бодит болгож ажилласан.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                Миний дизайны философи нь энгийн байдал болон хэрэглэгч төвтэй хандлагад тулгуурладаг. Сайн дизайн гэдэг нь зөвхөн харагдах байдлын тухай бус, харин бодит хүмүүст тулгарч буй бодит асуудлыг үр дүнтэй шийдвэрлэх ёстой гэж би үздэг.
Би хэрэглэгчийн туршлагыг тэргүүнд тавьсан, орчин үеийн бөгөөд цэвэрхэн интерфэйс боловсруулах чиглэлээр мэргэшсэн.
              </p>
            </div>
            <div style={{ position: 'relative' }}>
               <Image src="/about.jpg" alt="Profile" width={500} height={500} style={{ borderRadius: 'var(--radius-lg)', width: '100%', height: 'auto', border: '1px solid var(--border-light)' }} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}