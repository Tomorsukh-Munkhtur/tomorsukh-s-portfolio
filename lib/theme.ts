/** Admin: dark / light. Public site: Figma-style dark / light. */
export const ADMIN_THEMES = { key: "theme", values: ["dark", "light"] } as const;
export const SITE_THEMES = { key: "site-theme", values: ["dark", "light"] } as const;

type Themes = { key: string; values: readonly [string, string] };

/**
 * Runs before first paint (inlined in a layout) so the stored theme never
 * flashes. With `followSystem`, visitors who haven't picked a theme get the
 * one matching their operating system, and it follows the OS when it changes.
 */
export const themeScript = ({ key, values }: Themes, followSystem = false) => {
  const v = JSON.stringify(values);
  const k = JSON.stringify(key);
  const system = followSystem
    ? `var m=matchMedia("(prefers-color-scheme: light)"),d=m.matches?v[1]:v[0];m.addEventListener("change",function(e){try{if(!localStorage.getItem(${k}))document.documentElement.dataset.theme=e.matches?v[1]:v[0]}catch(_){}});`
    : `var d=v[0];`;
  return `(function(){var v=${v};${system}try{var t=localStorage.getItem(${k});document.documentElement.dataset.theme=v.indexOf(t)>-1?t:d;}catch(e){document.documentElement.dataset.theme=d;}})();`;
};
