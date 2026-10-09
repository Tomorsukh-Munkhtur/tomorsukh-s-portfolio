import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/project-editor";
import { getAdminCategories, getAdminProject } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Бүтээл засах" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const ctx = await requireAdmin();
  const { id } = await params;
  const [project, categories] = await Promise.all([getAdminProject(ctx, id), getAdminCategories(ctx)]);
  if (!project) notFound();
  // Keyed so navigating between projects resets the form state.
  return <ProjectEditor key={project.id} project={project} categories={categories} />;
}
