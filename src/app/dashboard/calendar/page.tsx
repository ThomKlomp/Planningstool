import { requireMembership } from "@/lib/current-membership";
import CalendarSyncCard from "./calendar-sync-card";

export default async function CalendarPage() {
  await requireMembership();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Agenda-koppeling</h1>
      <p className="mt-1 text-sm text-ink/60">
        Koppel je rooster aan Google Agenda of Apple Agenda. Nieuwe en
        gewijzigde diensten komen vanzelf door — reken op een vertraging van
        een paar uur, dit is geen realtime koppeling.
      </p>
      <div className="mt-6">
        <CalendarSyncCard />
      </div>
    </div>
  );
}
