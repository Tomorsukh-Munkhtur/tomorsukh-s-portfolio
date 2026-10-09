import { CanvasApp } from "@/components/site/canvas/canvas-app";
import { buildCanvas } from "@/lib/canvas-layout";
import { getCategories, getProjects, getSettings } from "@/lib/data";
import { displayName, getDictionary, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { lines, paragraphs } from "@/lib/utils";

/**
 * Home: the whole portfolio as a Figma-like file with three pages
 * (work, about, contact) on an infinite canvas.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const [settings, projects, categories] = await Promise.all([getSettings(), getProjects(), getCategories()]);

  // Tools are gathered from the projects themselves, most used first.
  const counts = new Map<string, number>();
  for (const p of projects) for (const tool of p.tools) counts.set(tool, (counts.get(tool) ?? 0) + 1);
  const tools = [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const skills = lines(t(settings, "services", locale));
  const about = paragraphs(t(settings, "about", locale));
  const clients = [...new Set(projects.map((p) => p.client.trim()).filter(Boolean))];

  const pages = buildCanvas({
    projects,
    categories: categories.map((c) => ({ id: c.id, slug: c.slug, title: t(c, "name", locale) })),
    about,
    skillCount: skills.length,
    toolCount: tools.length,
    clientCount: clients.length,
    labels: {
      intro: dict.canvas.intro,
      other: dict.canvas.other,
      about: dict.canvas.aboutFrame,
      skills: dict.canvas.skills,
      clients: dict.canvas.clients,
      contact: dict.canvas.contact,
    },
  });

  return (
    <main>
      <CanvasApp
        pages={pages}
        projects={projects}
        categories={categories}
        canvasBg={settings.canvas_bg}
        profile={{
          name: displayName(settings, locale),
          role: t(settings, "role", locale),
          tagline: t(settings, "tagline", locale),
          available: settings.available,
          email: settings.email,
          phone: settings.phone,
          location: t(settings, "location", locale),
          socials: settings.socials,
          skills,
          tools,
          about,
          avatar: settings.avatar,
          clients,
          projectCount: projects.length,
          // Only categories that actually hold published work.
          categoryCount: categories.filter((c) => projects.some((p) => p.category_id === c.id)).length,
        }}
      />
    </main>
  );
}
