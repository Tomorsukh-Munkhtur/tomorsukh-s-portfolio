'use client';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { Project } from '@/app/lib/data';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  /** Position in the list, shown as "01", "02", … */
  index?: number;
}

// Tilt toward the cursor and move the spotlight with it.
function handleMove(e: MouseEvent<HTMLAnchorElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
  el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  el.style.setProperty('--rx', `${((x - 0.5) * 7).toFixed(2)}deg`);
  el.style.setProperty('--ry', `${((0.5 - y) * 7).toFixed(2)}deg`);
}

function handleLeave(e: MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg');
  e.currentTarget.style.setProperty('--ry', '0deg');
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className={styles.cardLink}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <article className={styles.card}>
        <div className={styles.imageWrapper}>
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className={styles.image}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
          <span className={styles.viewBadge} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 14 14 6M7 6h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div className={styles.content}>
          <div className={styles.meta}>
            <span className={styles.category}>{project.category}</span>
            {index !== undefined && <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>}
          </div>
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.description}>{project.description}</p>
          <span className={styles.viewProject}>
            Дэлгэрэнгүй үзэх
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}

/** Shimmering placeholder shown while projects load. */
export function ProjectCardSkeleton() {
  return (
    <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
      <div className={styles.imageWrapper} />
      <div className={styles.content}>
        <span className={styles.skeletonLine} style={{ width: '30%' }} />
        <span className={styles.skeletonLine} style={{ width: '75%', height: '1.25rem' }} />
        <span className={styles.skeletonLine} style={{ width: '95%' }} />
        <span className={styles.skeletonLine} style={{ width: '60%' }} />
      </div>
    </div>
  );
}
