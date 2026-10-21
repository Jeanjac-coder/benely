import Link from "next/link";

/**
 * Logo Benely. « auto » suit le thème (couleur en clair, blanc en sombre);
 * « white » pour les fonds colorés quel que soit le thème.
 */
export function Logo({ variant = "auto", href = "/", height = 28 }: { variant?: "auto" | "white"; href?: string | null; height?: number }) {
  /* eslint-disable @next/next/no-img-element */
  const img = variant === "white"
    ? <img src="/brand/benely-logo-white.png" alt="Benely" style={{ height }} />
    : <>
        <img className="logo-light" src="/brand/benely-logo.png" alt="Benely" style={{ height }} />
        <img className="logo-dark" src="/brand/benely-logo-white.png" alt="" aria-hidden="true" style={{ height }} />
      </>;
  return href ? <Link href={href} className="logo" aria-label="Benely — accueil">{img}</Link> : <span className="logo">{img}</span>;
}
