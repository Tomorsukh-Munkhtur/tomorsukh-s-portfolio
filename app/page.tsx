'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProjectCard from '@/components/ProjectCard';
import Footer from '@/components/Footer';
import { getProjects } from './lib/storage';
import { Project } from './lib/data';

export default function Home() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);

  useEffect(() => {
    getProjects().then(projects => {
      setFeaturedProjects(projects.filter(p => p.featured).slice(0, 3));
    });
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        
        <section style={{ padding: '5rem 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.5rem' }}>Онцлох Төслүүд</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                  Миний сүүлийн үеийн ажлуудын дээж
                </p>
              </div>
              <Link href="/projects" style={{
                color: 'var(--accent-primary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Бүх төслүүдийг харах
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.16666 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 4.16667L15.8333 10L10 15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem'
            }}>
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}