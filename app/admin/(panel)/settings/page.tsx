import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { getAdminSettings } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Тохиргоо" };

export default async function SettingsPage() {
  const ctx = await requireAdmin();
  const settings = await getAdminSettings(ctx);

  return (
    <>
      <PageHeader title="Тохиргоо" description="Сайтын ерөнхий мэдээлэл, танилцуулга, өнгө." />
      <SettingsForm settings={settings} />
    </>
  );
}
