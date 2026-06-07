import ProjectDetailClient from './ProjectDetailClient';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailClient id={params.id} />;
}
