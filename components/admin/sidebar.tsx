"use client";

import { ExternalLink, Images, Inbox, LayoutDashboard, LogOut, Settings, Tags } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { signOut } from "@/lib/actions/admin";
import { ADMIN_THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Хянах самбар", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Бүтээлүүд", icon: Images },
  { href: "/admin/categories", label: "Ангилал", icon: Tags },
  { href: "/admin/messages", label: "Мессеж", icon: Inbox, badge: true },
  { href: "/admin/settings", label: "Тохиргоо", icon: Settings },
];

export function Sidebar({ unread, email }: { unread: number; email: string }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl lg:h-svh lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:py-7">
          <Link href="/admin" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-full bg-fg">
              <span className="size-2 rounded-full bg-accent" />
            </span>
            Портфолио
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle label="Өнгөний горим" themes={ADMIN_THEMES} />
          </div>
        </div>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative isolate flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-nav"
                    className="absolute inset-0 -z-10 rounded-xl bg-soft"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
                {item.badge && unread > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] leading-none font-semibold text-accent-fg">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden space-y-1 border-t border-line p-3 lg:block">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-soft hover:text-fg"
          >
            <ExternalLink className="size-4" strokeWidth={1.75} />
            Сайт үзэх
          </a>
          <form action={signOut}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-soft hover:text-fg">
              <LogOut className="size-4" strokeWidth={1.75} />
              Гарах
            </button>
          </form>
          <div className="flex items-center justify-between gap-2 px-3 pt-3">
            <span className="truncate text-xs text-faint">{email}</span>
            <ThemeToggle label="Өнгөний горим" themes={ADMIN_THEMES} />
          </div>
        </div>
      </div>
    </aside>
  );
}
