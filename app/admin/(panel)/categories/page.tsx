import { CategoryManager } from "@/components/admin/category-manager";
import { PageHeader } from "@/components/admin/ui";
import { getAdminCategories } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Ангилал" };

export default async function CategoriesPage() {
  const ctx = await requireAdmin();
  const categories = await getAdminCategories(ctx);

  return (
    <>
      <PageHeader
        title="Ангилал"
        description="Бүтээлүүдийг шүүх ангиллууд. Чирж эрэмбэлсэн дарааллаар сайт дээр харагдана."
      />
      <CategoryManager categories={categories} />
    </>
  );
}
