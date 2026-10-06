'use client';

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProjectCard, { ProjectCardSkeleton } from '@/components/ProjectCard';
import Footer from '@/components/Footer';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import ScrollText from '@/components/ScrollText';
import { EMAIL } from '@/components/socials';
import { getProjects } from './lib/storage';
import { useYearsOfExperience } from './lib/experience';
import { Project } from './lib/data';
import styles from './page.module.css';

const MARQUEE = ['UI/UX дизайн', 'Веб дизайн', 'Мобайл апп', 'Веб систем', 'Брэндбүүк', 'Лого', 'Дижитал зураг', 'Прототип'];

const SERVICES: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: 'UI/UX дизайн',
    text: 'Хэрэглэгчийн хэрэгцээг судалж, wireframe-ээс эхлээд интерактив прототип хүртэл ойлгомжтой туршлага бүтээнэ.',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="14" rx="2.5" />
        <path d="M3 8h18M8 21h8M12 18v3" />
      </svg>
    ),
  },
  {
    title: 'Веб & мобайл',
    text: 'Вебсайт, веб систем, мобайл аппликейшнд зориулсан цэвэрхэн, орчин үеийн интерфэйс.',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
      </svg>
    ),
  },
  {
    title: 'Брэндинг & лого',
    text: 'Лого, брэндбүүк, өнгө ба типографын нэгдмэл, танигдахуйц систем.',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
      </svg>
    ),
  },
  {
    title: 'Дижитал зураг',
    text: 'Бүтээгдэхүүн, вебсайтын өнгө төрхийг тодотгох дижитал иллюстраци.',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 20c1.5-4 4-6.5 8-8.5M14.5 4.5l5 5L12 17l-5-5z" />
        <path d="M4 20l3-1" />
      </svg>
    ),
  },
];

function spotlight(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--gx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--gy', `${e.clientY - r.top}px`);
}

export default function Home() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const years = useYearsOfExperience();

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const featuredProjects = (projects ?? []).filter((p) => p.featured).slice(0, 3);
  const categoryCount = new Set((projects ?? []).map((p) => p.category)).size;

  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* ---------- Marquee ---------- */}
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1}>
                {MARQUEE.map((item) => (
                  <li key={item}>
                    <span className={styles.marqueeText}>{item}</span>
                    <span className={styles.marqueeStar} aria-hidden="true">
                      ✦
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* ---------- Featured work ---------- */}
        <section id="work" className={styles.section}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <Reveal y={16}>
                  <span className="eyebrow">Сонгомол ажлууд</span>
                </Reveal>
                <Reveal delay={80}>
                  <h2 className={styles.sectionTitle}>
                    Онцлох <span className="gradient-text">төслүүд</span>
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={160} className={styles.sectionAside}>
                <p>Миний сүүлийн үеийн ажлуудын дээж</p>
                <Link href="/projects" className={styles.arrowLink}>
                  Бүх төслүүдийг харах
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </Reveal>
            </div>

            <div className={styles.projectGrid}>
              {projects === null
                ? [0, 1, 2].map((i) => <ProjectCardSkeleton key={i} />)
                : featuredProjects.map((project, i) => (
                    <Reveal key={project.id} delay={i * 110}>
                      <ProjectCard project={project} index={i} />
                    </Reveal>
                  ))}
            </div>
          </div>
        </section>

        {/* ---------- Services ---------- */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <Reveal y={16}>
                  <span className="eyebrow">Юу хийдэг вэ</span>
                </Reveal>
                <Reveal delay={80}>
                  <h2 className={styles.sectionTitle}>
                    Санаанаас <span className="gradient-text">бүтээгдэхүүн</span> хүртэл
                  </h2>
                </Reveal>
              </div>
            </div>
            <div className={styles.services}>
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={i * 90}>
                  <article className={styles.service} onMouseMove={spotlight}>
                    <span className={styles.serviceIcon}>{s.icon}</span>
                    <span className={styles.serviceIndex}>0{i + 1}</span>
                    <h3 className={styles.serviceTitle}>{s.title}</h3>
                    <p className={styles.serviceText}>{s.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Philosophy + stats ---------- */}
        <section className={styles.section}>
          <div className={`container ${styles.about}`}>
            <div>
              <Reveal y={16}>
                <span className="eyebrow">Миний философи</span>
              </Reveal>
              <ScrollText
                className={styles.statement}
                text="Сайн дизайн гэдэг нь зөвхөн харагдах байдлын тухай бус, харин бодит хүмүүст тулгарч буй бодит асуудлыг үр дүнтэй шийдвэрлэх ёстой."
              />
              <Reveal>
                <Link href="/about" className={styles.arrowLink}>
                  Миний тухай дэлгэрэнгүй
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </Reveal>
            </div>

            <div className={styles.stats}>
              <Reveal className={styles.stat}>
                <span className={styles.statValue}>
                  <CountUp value={years ?? 0} suffix="+" />
                </span>
                <span className={styles.statLabel}>жилийн туршлага</span>
              </Reveal>
              {projects !== null && projects.length > 0 && (
                <>
                  <Reveal className={styles.stat} delay={100}>
                    <span className={styles.statValue}>
                      <CountUp value={projects.length} />
                    </span>
                    <span className={styles.statLabel}>хийсэн төсөл</span>
                  </Reveal>
                  <Reveal className={styles.stat} delay={200}>
                    <span className={styles.statValue}>
                      <CountUp value={categoryCount} />
                    </span>
                    <span className={styles.statLabel}>дизайны чиглэл</span>
                  </Reveal>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ---------- Contact CTA ---------- */}
        <section className={styles.ctaSection}>
          <div className="container">
            <Reveal className={styles.ctaCard}>
              <Image src="/hero/meadow-960.webp" alt="" fill sizes="(max-width: 1240px) 100vw, 1240px" className={styles.ctaBg} />
              <div className={styles.ctaContent}>
                <span className="eyebrow">Хамтран ажиллах уу?</span>
                <h2 className={styles.ctaTitle}>
                  Хамтдаа <span className="gradient-text">гайхалтай</span> зүйл бүтээе
                </h2>
                <p className={styles.ctaText}>
                  Төслийн санаа байна уу эсвэл зүгээр л мэндчилмээр байна уу? Надад бичээрэй.
                </p>
                <div className={styles.ctaActions}>
                  <Link href="/contact" className={styles.ctaButton}>
                    Холбоо барих
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <a href={`mailto:${EMAIL}`} className={styles.ctaMail}>
                    {EMAIL}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
