import { Mascot } from "./Mascot";

/** Écran de chargement: BEN sautille pendant que la page se prépare. */
export function Loader({ label = "BEN prépare votre page" }: { label?: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div>
        <Mascot pose="happy" height={120} motion="none" className="mascot-hop" />
        <div className="shadow" />
        <p>{label}<span className="dots" aria-hidden="true"><i /><i /><i /></span></p>
        <div className="bar" aria-hidden="true"><i /></div>
      </div>
    </div>
  );
}
