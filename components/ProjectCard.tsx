import Link from 'next/link';
import { Project } from '@/app/lib/data';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.imageWrapper}>
          {project.imageUrl && project.imageUrl.startsWith('/') ? (
            <img 
              src={project.imageUrl} 
              alt={project.title} 
              className={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.classList.add(styles.imageError);
              }}
            />
          ) : (
            <div className={styles.placeholder}>🎨</div>
          )}
          {(!project.imageUrl || (project.imageUrl && !project.imageUrl.startsWith('/'))) && (
             <div className={styles.placeholderOverlay}>🎨</div>
          )}
        </div>
        <div className={styles.content}>
          <span className={styles.category}>{project.category}</span>
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.description}>{project.description}</p>
          <span className={styles.viewProject}>
            View Project
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}