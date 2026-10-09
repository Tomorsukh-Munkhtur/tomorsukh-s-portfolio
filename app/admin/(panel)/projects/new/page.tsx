import { ProjectEditor } from "@/components/admin/project-editor";
import { getAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Шинэ бүтээл" };

export default async function NewProjectPage() {
  const ctx = await requireAdmin();
  const categories = await getAdminCategories(ctx);
  return <ProjectEditor project={null} categories={categories} />;
}
