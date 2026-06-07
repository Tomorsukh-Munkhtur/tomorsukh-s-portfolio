'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import Footer from '@/components/Footer';
import { getProjects, getCategories } from '@/app/lib/storage';
import { Project } from '@/app/lib/data';

export default function Projects() {
  const [filter, setFilter] = useState<string>('Бүгд');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>(['Бүгд']);

  useEffect(() => {
    getProjects().then(setProjects);
    getCategories().then(cats => setCategories(['Бүгд', ...cats]));
  }, []);
  
  const allFilteredProjects = filter === 'Бүгд' 
    ? projects 
    : projects.filter(p => p.category === filter);
    
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
      <main style={{ paddingTop: '5rem' }}>
        <section style={{ padding: '5rem 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', marginBottom: '1.5rem' }}>Бүх Төслүүд</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                Мобайл аппликейшн, веб интерфэйс зэрэг миний сүүлийн үеийн дизайны ажлуудын цуглуулга.
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleFilterChange(category)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      color: filter === category ? 'white' : 'var(--text-secondary)',
                      background: filter === category ? 'var(--accent-primary)' : 'var(--surface)',
                      border: '1px solid ' + (filter === category ? 'var(--accent-primary)' : 'var(--border-light)'),
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem'
            }}>
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            
            {visibleCount < allFilteredProjects.length && (
              <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <button
                  onClick={handleShowMore}
                  style={{
                    padding: '1rem 2.5rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  Load More Projects
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