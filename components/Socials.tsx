import { SOCIALS } from "@/lib/site";

const ICONS: Record<string, JSX.Element> = {
  facebook: <path d="M14 8h3V4h-3c-2.8 0-4.5 1.9-4.5 4.7V11H7v4h2.5v8h4v-8h3l.5-4h-3.5V9c0-.6.4-1 1-1z" fill="currentColor" />,
  instagram: <g fill="none" stroke="currentColor" strokeWidth="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".6" fill="currentColor" /></g>,
  tiktok: <path d="M15.5 3c.4 2.4 1.9 3.9 4.3 4.1v3.4c-1.6 0-3-.5-4.2-1.3V16a5.7 5.7 0 1 1-5.7-5.7c.3 0 .7 0 1 .1v3.5a2.3 2.3 0 1 0 1.6 2.2V3z" fill="currentColor" />,
};

/** Liens vers les réseaux sociaux de Benely. */
export function Socials({ className = "" }: { className?: string }) {
  return (
    <div className={`socials ${className}`}>
      {SOCIALS.map((s) => (
        <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Benely sur ${s.label}`} title={s.label}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[s.key]}</svg>
        </a>
      ))}
    </div>
  );
}
