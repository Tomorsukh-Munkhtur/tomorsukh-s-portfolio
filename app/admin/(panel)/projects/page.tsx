import { Plus } from "lucide-react";
import Link from "next/link";
import { ProjectList } from "@/components/admin/project-list";
import { PageHeader } from "@/components/admin/ui";
import { getAdminCategories, getAdminProjects } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Бүтээлүүд" };

export default async function ProjectsPage() {
  const ctx = await requireAdmin();
  const [projects, categories] = await Promise.all([getAdminProjects(ctx), getAdminCategories(ctx)]);

  return (
    <>
      <PageHeader
        title="Бүтээлүүд"
        description={`${projects.length} бүтээл · ${projects.filter((p) => p.published).length} нийтлэгдсэн`}
        actions={
          <Link
            href="/admin/projects/new"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            <Plus className="size-4" /> Шинэ бүтээл
          </Link>
        }
      />
      <ProjectList projects={projects} categories={categories} />
    </>
  );
}
