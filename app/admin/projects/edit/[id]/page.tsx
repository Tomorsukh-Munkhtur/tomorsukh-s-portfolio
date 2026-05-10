import { projects } from '@/app/lib/data';
import EditProjectClient from './EditProjectClient';

export function generateStaticParams() {
  return projects.map((project) => ({
    id: project.id,
  }));
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return <EditProjectClient id={params.id} />;
}
