import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { RankBars } from "@/components/admin/rank-bars";
import { StatTile } from "@/components/admin/stat-tile";
import { Card, PageHeader } from "@/components/admin/ui";
import { ViewsChart } from "@/components/admin/views-chart";
import { getAdminProjects, getMessages, getStats } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Хянах самбар" };

const RANGES = [7, 30, 90] as const;

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const ctx = await requireAdmin();
  const requested = Number((await searchParams).days);
  const days = RANGES.find((r) => r === requested) ?? 30;

  const [stats, projects, messages] = await Promise.all([
    getStats(ctx, days),
    getAdminProjects(ctx),
    getMessages(ctx),
  ]);

  const publishedCount = projects.filter((p) => p.published).length;
  const unread = messages.filter((m) => !m.read);
  const delta = stats.prevViews > 0 ? (stats.views - stats.prevViews) / stats.prevViews : null;

  return (
    <>
      <PageHeader
        title="Сайн байна уу"
        description="Портфолио сайтын ерөнхий байдал."
        actions={
          <Link
            href="/admin/projects/new"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            <Plus className="size-4" /> Шинэ бүтээл
          </Link>
        }
      />

      {/* Date range scopes everything below. */}
      <div className="mb-6 inline-flex rounded-full border border-line p-0.5 text-xs">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={r === 30 ? "/admin" : `/admin?days=${r}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 transition-colors",
              r === days ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
          >
            Сүүлийн {r} хоног
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Хуудас үзэлт"
          value={stats.views}
          delta={delta}
          note={`өмнөх ${days} хоногоос`}
          highlight
        />
        <StatTile label="Давтагдаагүй зочид" value={stats.visitors} note={`Нийт үзэлт: ${stats.totalViews.toLocaleString("en-US")}`} />
        <StatTile label="Нийтлэгдсэн бүтээл" value={publishedCount} suffix={`/ ${projects.length}`} note="ноорог орсон" />
        <StatTile label="Уншаагүй мессеж" value={unread.length} note={`Нийт ${messages.length}`} />
      </div>

      <Card className="mt-3">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Өдөр тутмын хуудас үзэлт</h2>
          <span className="text-xs text-muted">Улаанбаатарын цагаар</span>
        </div>
        <ViewsChart data={stats.daily} />
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-5 text-sm font-medium">Хамгийн их үзэлттэй бүтээл</h2>
          <RankBars
            empty="Энэ хугацаанд бүтээлийн үзэлт алга."
            rows={stats.topProjects.map((p) => ({
              key: p.project_id,
              value: p.views,
              label: (
                <Link href={`/admin/projects/${p.project_id}`} className="hover:underline">
                  {p.title_mn || p.title_en}
                </Link>
              ),
            }))}
          />
        </Card>
        <Card>
          <h2 className="mb-5 text-sm font-medium">Зочид хаанаас ирсэн бэ</h2>
          <RankBars
            empty="Одоогоор мэдээлэл алга."
            rows={stats.referrers.map((r) => ({
              key: r.source,
              value: r.views,
              label: r.source === "direct" ? "Шууд / тодорхойгүй" : r.source,
            }))}
          />
        </Card>
      </div>

      <Card className="mt-3">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Сүүлийн мессежүүд</h2>
          <Link href="/admin/messages" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
            Бүгдийг харах <ArrowUpRight className="size-3" />
          </Link>
        </div>
        {messages.length === 0 ? (
          <p className="py-6 text-sm text-faint">Одоогоор мессеж ирээгүй байна.</p>
        ) : (
          <ul className="divide-y divide-line">
            {messages.slice(0, 4).map((m) => (
              <li key={m.id}>
                <Link href={`/admin/messages?open=${m.id}`} className="flex items-center gap-4 py-3">
                  <span className={cn("size-2 shrink-0 rounded-full", m.read ? "bg-transparent" : "bg-accent")} />
                  <span className="w-36 shrink-0 truncate text-sm font-medium">{m.name}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {m.subject ? `${m.subject} — ` : ""}
                    {m.body}
                  </span>
                  <span className="hidden shrink-0 text-xs text-faint sm:block">
                    {formatDateTime(m.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
