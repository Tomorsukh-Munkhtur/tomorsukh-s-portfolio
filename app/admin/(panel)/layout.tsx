import { Suspense } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { ToastProvider } from "@/components/admin/ui";
import { getUnreadCount } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

async function Shell({ children }: { children: React.ReactNode }) {
  const ctx = await requireAdmin();
  const unread = await getUnreadCount(ctx);

  return (
    <div className="lg:grid lg:grid-cols-[256px_1fr]">
      <Sidebar unread={unread} email={ctx.demo ? "demo@portfolio" : ctx.email} />
      <div className="min-w-0">
        {ctx.demo && (
          <div className="border-b border-accent/30 bg-accent/10 px-5 py-2.5 text-center text-xs md:px-10">
            <span className="font-semibold">Демо горим.</span> Supabase холбогдоогүй тул жишээ өгөгдөл
            харагдаж байна, өөрчлөлт хадгалагдахгүй. Тохируулах заавар: <code className="font-mono">README.md</code>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="grid min-h-svh place-items-center">
            <span className="size-2 animate-ping rounded-full bg-accent" />
          </div>
        }
      >
        <Shell>{children}</Shell>
      </Suspense>
    </ToastProvider>
  );
}
