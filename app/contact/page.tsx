'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import Reveal from '@/components/Reveal';
import { EMAIL, SOCIALS } from '@/components/socials';
import { saveMessage } from '@/app/lib/storage';
import styles from './page.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    content: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    await saveMessage(formData);
    setStatus('success');
    setFormData({ name: '', email: '', content: '' });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Холбоо барих"
          title={<>Хамтдаа <span className="gradient-text">ярилцъя</span></>}
          subtitle="Бро танд төслийн санаа байна уу эсвэл зүгээр л мэндчилмээр байна уу? Би тантай ярилцахдаа таатай байх болно."
        />

        <section className={styles.section}>
          <div className={`container ${styles.grid}`}>
            <div className={styles.aside}>
              <Reveal className={styles.infoCard}>
                <span className={styles.infoLabel}>Имэйл</span>
                <a href={`mailto:${EMAIL}`} className={styles.email}>
                  {EMAIL}
                </a>
                <p className={styles.note}>Жич энэ миний албан ёсны имэйл шүү.</p>
                <button type="button" onClick={copyEmail} className={styles.copy} aria-live="polite">
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="m3 8.5 3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Хуулагдлаа
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="5" y="5" width="8.5" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10.5 5V3.5a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      Имэйл хуулах
                    </>
                  )}
                </button>
              </Reveal>

              <Reveal delay={120} className={styles.infoCard}>
                <span className={styles.infoLabel}>Сошиал</span>
                <div className={styles.socials}>
                  {SOCIALS.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.social}>
                      {s.icon}
                      {s.label}
                      <svg className={styles.socialArrow} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M6 14 14 6M7 6h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={80} className={styles.formCard}>
              {status === 'success' ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3>Зурвас амжилттай илгээгдлээ!</h3>
                  <p>Би тантай удахгүй холбогдох болно.</p>
                  <button type="button" onClick={() => setStatus('idle')} className={styles.secondaryButton}>
                    Дахин зурвас бичих
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label htmlFor="name">Таны нэр эсвэл хоч</label>
                      <input
                        id="name"
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Таны нэр"
                      />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="email">Таны имэйл</label>
                      <input
                        id="email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="tani@email.com"
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="content">Зурвас</label>
                    <textarea
                      id="content"
                      required
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Төслийнхөө талаар бичнэ үү"
                    />
                  </div>
                  <button type="submit" disabled={status === 'submitting'} className={styles.submit}>
                    {status === 'submitting' ? (
                      <>
                        <span className={styles.spinner} aria-hidden="true" />
                        Илгээж байна...
                      </>
                    ) : (
                      <>
                        Илгээх
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M4 12 20 4l-6 16-3-7-7-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
