'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProjectById } from '@/app/lib/storage';
import { Project } from '@/app/lib/data';
import styles from './page.module.css';

interface ProjectDetailClientProps {
  id: string;
}

export default function ProjectDetailClient({ id }: ProjectDetailClientProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const foundProject = getProjectById(id);
    setProject(foundProject);
    setLoading(false);
  }, [id]);

  const scroll = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const scrollAmount = 300;
      if (direction === 'left') {
        galleryRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        galleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (project && project.images) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images!.length);
    }
  }, [project]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (project && project.images) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images!.length) % project.images!.length);
    }
  }, [project]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className="container">
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>Ачааллаж байна...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className="container">
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <h2>Төсөл олдсонгүй</h2>
              <Link href="/projects" className={styles.backLink}>
                ← Төслүүд рүү буцах
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <Link href="/projects" className={styles.backLink}>
            ← Төслүүд рүү буцах
          </Link>
          
          <article className={styles.projectArticle}>
            <header className={styles.header}>
              <span className={styles.category}>{project.category}</span>
              <h1 className={styles.title}>{project.title}</h1>
            </header>

            <div className={styles.imageWrapper}>
              {project.imageUrl && project.imageUrl.startsWith('/') ? (
                 <Image
                  src={project.imageUrl}
                  alt={project.title}
                  width={1200}
                  height={600}
                  className={styles.image}
                  priority
                   unoptimized={true}
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                /> 
              ) : (
                <div className={styles.placeholder}>
                   {project.imageUrl ? (
                    <img 
                      src={project.imageUrl} 
                      alt={project.title} 
                      className={styles.image} 
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                   ) : (
                    <span>🎨</span>
                   )}
                </div>
              )}
            </div>

            <div className={styles.content}>
              <div className={styles.description}>
                <p>{project.description}</p>
                {project.images && project.images.length > 0 && (
                  <div className={styles.gallerySection}>
                    <div className={styles.galleryHeader}>
                      <h3 className={styles.galleryTitle}>Зургийн цомог</h3>
                      <div className={styles.galleryControls}>
                        <button onClick={() => scroll('left')} className={styles.navButton} aria-label="Өмнөх">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button onClick={() => scroll('right')} className={styles.navButton} aria-label="Дараах">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className={styles.galleryContainer} ref={galleryRef}>
                      <div className={styles.galleryTrack}>
                        {project.images.map((img, index) => (
                          <div 
                            key={index} 
                            className={styles.galleryItem}
                            onClick={() => openLightbox(index)}
                          >
                            <img 
                              src={img} 
                              alt={`Gallery ${index + 1}`} 
                              className={styles.galleryImage}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      </main>
      
      {lightboxOpen && project.images && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox} onContextMenu={(e) => e.preventDefault()}>
          <button className={styles.closeButton} onClick={closeLightbox}>×</button>
          
          <button className={`${styles.lightboxNav} ${styles.prev}`} onClick={prevImage}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img 
              src={project.images[currentImageIndex]} 
              alt={`Full screen ${currentImageIndex + 1}`} 
              className={styles.lightboxImage}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className={styles.lightboxCounter}>
              {currentImageIndex + 1} / {project.images.length}
            </div>
          </div>
          
          <button className={`${styles.lightboxNav} ${styles.next}`} onClick={nextImage}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}
