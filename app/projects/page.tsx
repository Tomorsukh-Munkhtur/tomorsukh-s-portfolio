'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PageHero from '@/components/PageHero';
import ProjectCard, { ProjectCardSkeleton } from '@/components/ProjectCard';
import Reveal from '@/components/Reveal';
import Footer from '@/components/Footer';
import { getProjects, getCategories } from '@/app/lib/storage';
import { Project } from '@/app/lib/data';
import styles from './page.module.css';

export default function Projects() {
  const [filter, setFilter] = useState<string>('Бүгд');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [categories, setCategories] = useState<string[]>(['Бүгд']);

  useEffect(() => {
    getProjects().then(setProjects);
    getCategories().then(cats => setCategories(['Бүгд', ...cats]));
  }, []);

  const allFilteredProjects = filter === 'Бүгд'
    ? projects ?? []
    : (projects ?? []).filter(p => p.category === filter);

  const visibleProjects = allFilteredProjects.slice(0, visibleCount);

  const handleFilterChange = (category: string) => {
    setFilter(category);
    setVisibleCount(6);
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="Портфолио"
          title={<>Бүх <span className="gradient-text">төслүүд</span></>}
          subtitle="Мобайл аппликейшн, веб интерфэйс зэрэг миний сүүлийн үеийн дизайны ажлуудын цуглуулга."
        >
          <div className={styles.filters} role="group" aria-label="Ангиллаар шүүх">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => handleFilterChange(category)}
                className={styles.filter}
                data-active={filter === category}
                aria-pressed={filter === category}
              >
                {category}
              </button>
            ))}
          </div>
        </PageHero>

        <section className={styles.section}>
          <div className="container">
            {projects !== null && (
              <p className={styles.count}>
                <span>{String(allFilteredProjects.length).padStart(2, '0')}</span> төсөл
              </p>
            )}

            {/* Re-keyed on filter change so the cards replay their entrance */}
            <div key={filter} className={styles.grid}>
              {projects === null
                ? Array.from({ length: 6 }, (_, i) => <ProjectCardSkeleton key={i} />)
                : visibleProjects.map((project, i) => (
                    <Reveal key={project.id} delay={(i % 3) * 100}>
                      <ProjectCard project={project} index={i} />
                    </Reveal>
                  ))}
            </div>

            {projects !== null && allFilteredProjects.length === 0 && (
              <p className={styles.empty}>Энэ ангилалд одоогоор төсөл алга байна.</p>
            )}

            {visibleCount < allFilteredProjects.length && (
              <div className={styles.moreWrap}>
                <button type="button" onClick={handleShowMore} className={styles.more}>
                  Илүү ихийг үзэх
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
