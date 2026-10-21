// BEN, la mascotte Benely: cinq poses détourées (public/mascot), animations purement CSS.
export type Pose = "wave" | "point" | "surprised" | "happy" | "think";
export type Motion = "float" | "sway" | "bounce" | "none";

const RATIO: Record<Pose, number> = { wave: 353 / 420, point: 369 / 420, surprised: 240 / 420, happy: 314 / 420, think: 263 / 420 };
const ALT: Record<Pose, string> = {
  wave: "BEN, la mascotte Benely, fait coucou",
  point: "BEN fait un clin d'œil et pointe du doigt",
  surprised: "BEN, surpris",
  happy: "BEN, ravi",
  think: "BEN réfléchit",
};

export function Mascot({ pose, height = 160, motion = "float", decorative = true, eager = false, className = "", style }: {
  pose: Pose; height?: number; motion?: Motion; decorative?: boolean; eager?: boolean; className?: string; style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/mascot/${pose}.webp`}
      alt={decorative ? "" : ALT[pose]}
      aria-hidden={decorative || undefined}
      width={Math.round(height * RATIO[pose])}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`mascot mascot-${motion} ${className}`}
      style={style}
    />
  );
}
