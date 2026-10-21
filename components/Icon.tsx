// Icônes au trait (24×24), héritent de la couleur du texte.
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  strategy: "M4 4h10l6 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm10 0v6h6M7 13h10M7 17h6",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v5M16 3v5",
  wallet: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 0 12-4v4M16 13.5h2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  team: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4.5-6.5",
  card: "M3 6h18v12H3zM3 10h18M7 15h4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8-3 2-1-2-3.5-2.2.6a7 7 0 0 0-1.6-.9L15.6 5h-4l-.6 2.2a7 7 0 0 0-1.6.9L7.2 7.5 5.2 11l2 1-2 1 2 3.5 2.2-.6c.5.4 1 .7 1.6.9l.6 2.2h4l.6-2.2c.6-.2 1.1-.5 1.6-.9l2.2.6 2-3.5z",
  shield: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z",
  users: "M16 21a6 6 0 0 0-12 0M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21a5 5 0 0 0-4-4.9",
  tag: "M3 12V4h8l10 10-8 8zM7.5 7.5h.01",
  cpu: "M7 7h10v10H7zM10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3",
  text: "M4 6h16M4 12h16M4 18h10",
  alert: "M12 3 2 20h20zM12 10v4M12 17h.01",
  log: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  arrow: "M5 12h14M13 6l6 6-6 6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
