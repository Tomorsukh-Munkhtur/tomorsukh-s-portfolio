import { getProjects, getSettings } from "@/lib/data";
import { displayName, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

/**
 * Version 3 starts here. The admin and the data (projects, settings, stats)
 * carry over from v2; the public site is a blank page waiting for its design.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const [settings, projects] = await Promise.all([getSettings(), getProjects()]);
  const role = t(settings, "role", locale);

  return (
    <main className="grid min-h-svh place-items-center p-8">
      <div className="max-w-xl text-center">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">v3</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">{displayName(settings, locale)}</h1>
        {role && <p className="mt-3 text-lg text-muted">{role}</p>}
        {/* Proof that the data is wired up; the new design replaces all of this. */}
        <p className="mt-10 font-mono text-xs text-faint">{projects.length} projects · admin & data connected</p>
      </div>
    </main>
  );
}
