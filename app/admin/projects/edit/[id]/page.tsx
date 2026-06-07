import EditProjectClient from './EditProjectClient';

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return <EditProjectClient id={params.id} />;
}
