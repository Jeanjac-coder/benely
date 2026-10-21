import { supabaseAdmin } from "@/lib/supabase/admin";
import { StatusSelect } from "./StatusSelect";

const SLOTS: Record<string, string> = { matin: "Matin (8h–12h)", midi: "Midi (12h–14h)", "apres-midi": "Après-midi (14h–18h)", soir: "Soir (18h–20h)" };
const CHANNELS: Record<string, string> = { visio: "Visio", telephone: "Téléphone", whatsapp: "WhatsApp" };

export default async function Consultations() {
  const { data } = await supabaseAdmin().from("consultation_requests")
    .select("id, preferred_date, preferred_slot, channel, phone, topic, status, created_at, organizations(name)")
    .order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  return (
    <>
      <h1>Rendez-vous stratégiques</h1>
      <p className="muted">Demandes d'échange de 30 minutes envoyées depuis le diagnostic. Contactez le client sur le canal choisi, puis mettez à jour le statut.</p>
      {rows.length === 0 ? <p className="card muted">Aucune demande pour le moment.</p> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Reçue le</th><th>Organisation</th><th>Date souhaitée</th><th>Créneau</th><th>Canal</th><th>Téléphone</th><th>Sujet</th><th>Statut</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleString("fr-FR")}</td>
              <td>{(r.organizations as unknown as { name: string } | null)?.name}</td>
              <td>{new Date(`${r.preferred_date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</td>
              <td>{SLOTS[r.preferred_slot] ?? r.preferred_slot}</td>
              <td>{CHANNELS[r.channel] ?? r.channel}</td>
              <td>{r.phone ?? "—"}</td>
              <td className="small">{r.topic ?? "—"}</td>
              <td><StatusSelect id={r.id} status={r.status} /></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
