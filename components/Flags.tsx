// Drapeaux des pays couverts, en SVG (les émojis drapeaux ne s'affichent pas sous Windows).
const STAR = "M0,-1 L0.2245,-0.309 L0.951,-0.309 L0.3633,0.118 L0.5878,0.809 L0,0.382 L-0.5878,0.809 L-0.3633,0.118 L-0.951,-0.309 L-0.2245,-0.309Z";

const Star = ({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) => (
  <path d={STAR} transform={`translate(${x} ${y}) scale(${r})`} fill={fill} />
);

const vertical = (a: string, b: string, c: string) => (
  <><rect width="1" height="2" fill={a} /><rect x="1" width="1" height="2" fill={b} /><rect x="2" width="1" height="2" fill={c} /></>
);

export const COUNTRY_FLAGS: { code: string; name: string; flag: JSX.Element }[] = [
  { code: "CI", name: "Côte d'Ivoire", flag: vertical("#F77F00", "#FFFFFF", "#009E60") },
  { code: "SN", name: "Sénégal", flag: <>{vertical("#00853F", "#FDEF42", "#E31B23")}<Star x={1.5} y={1} r={0.32} fill="#00853F" /></> },
  { code: "CM", name: "Cameroun", flag: <>{vertical("#007A5E", "#CE1126", "#FCD116")}<Star x={1.5} y={1} r={0.32} fill="#FCD116" /></> },
  { code: "BF", name: "Burkina Faso", flag: <><rect width="3" height="1" fill="#EF2B2D" /><rect y="1" width="3" height="1" fill="#009E49" /><Star x={1.5} y={1} r={0.34} fill="#FCD116" /></> },
  { code: "ML", name: "Mali", flag: vertical("#14B53A", "#FCD116", "#CE1126") },
  { code: "BJ", name: "Bénin", flag: <><rect width="1.2" height="2" fill="#008751" /><rect x="1.2" width="1.8" height="1" fill="#FCD116" /><rect x="1.2" y="1" width="1.8" height="1" fill="#E8112D" /></> },
  {
    code: "TG", name: "Togo", flag: (
      <>
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} y={i * 0.4} width="3" height="0.4" fill={i % 2 ? "#FFE700" : "#006A4E"} />)}
        <rect width="1.2" height="1.2" fill="#D21034" /><Star x={0.6} y={0.6} r={0.36} fill="#FFFFFF" />
      </>
    ),
  },
];

/** Rangée de drapeaux avec le nom du pays en infobulle (et pour les lecteurs d'écran). */
export function Flags({ size = 22, withNames = false, className = "" }: { size?: number; withNames?: boolean; className?: string }) {
  return (
    <ul className={`flags ${className}`} aria-label="Pays couverts">
      {COUNTRY_FLAGS.map((c) => (
        <li key={c.code} title={c.name}>
          <svg viewBox="0 0 3 2" width={size * 1.5} height={size} role="img" aria-label={c.name}>{c.flag}</svg>
          {withNames && <span>{c.name}</span>}
        </li>
      ))}
    </ul>
  );
}
