// Réseaux sociaux de Benely: adresses à renseigner dans l'environnement (Vercel / .env.local).
export const SOCIALS = [
  { key: "facebook", label: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/" },
  { key: "instagram", label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/" },
  { key: "tiktok", label: "TikTok", url: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://www.tiktok.com/" },
] as const;

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@benely.africa";
