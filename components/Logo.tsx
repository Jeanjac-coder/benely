import Link from "next/link";

/** Logo Benely: « color » sur fond clair, « white » sur fond Electra ou sombre. */
export function Logo({ variant = "color", href = "/", height = 28 }: { variant?: "color" | "white"; href?: string | null; height?: number }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={variant === "white" ? "/brand/benely-logo-white.png" : "/brand/benely-logo.png"} alt="Benely" style={{ height, width: "auto" }} />
  );
  return href ? <Link href={href} className="logo" aria-label="Benely — accueil">{img}</Link> : <span className="logo">{img}</span>;
}
