"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type BlockInfo = {
  id: string;
  title: string;
  description: string;
  wide: boolean;
  /** Voor medewerkers vast te zetten (alleen relevant voor managers). */
  pinnable: boolean;
};

export default function DashboardBoard({
  isManager,
  blocks,
  pinnedIds,
  ownIds: initialOwn,
  nodes,
  initialPinnedByManager,
}: {
  isManager: boolean;
  /** Alle blokken die deze gebruiker mag gebruiken. */
  blocks: BlockInfo[];
  /** Door een manager vastgezet voor deze medewerker (bovenaan, niet te wijzigen). */
  pinnedIds: string[];
  ownIds: string[];
  /** Server-gerenderde inhoud per blok-id (alleen van blokken die nu getoond worden). */
  nodes: Record<string, React.ReactNode>;
  /** Manager: welke blokken zijn voor medewerkers vastgezet. */
  initialPinnedByManager: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [ownIds, setOwnIds] = useState(initialOwn);
  const [pinnedByManager, setPinnedByManager] = useState(initialPinnedByManager);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [adding, setAdding] = useState(false);

  const byId = new Map(blocks.map((b) => [b.id, b]));
  const available = blocks.filter((b) => !ownIds.includes(b.id) && !pinnedIds.includes(b.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Op touchscreens pas slepen na even ingedrukt houden, zodat scrollen blijft werken.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function saveLayout(next: string[] | null, refresh = false) {
    setStatus("saving");
    const ok = await fetch("/api/dashboard/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: next }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    setStatus(ok ? "saved" : "error");
    if (ok && refresh) router.refresh();
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = arrayMove(ownIds, ownIds.indexOf(String(active.id)), ownIds.indexOf(String(over.id)));
    setOwnIds(next);
    saveLayout(next);
  }

  function remove(id: string) {
    const next = ownIds.filter((x) => x !== id);
    setOwnIds(next);
    saveLayout(next);
  }

  function add(id: string) {
    const next = [...ownIds, id];
    setOwnIds(next);
    // Nieuwe blokken worden op de server gerenderd, dus daarna opnieuw laden.
    saveLayout(next, true);
  }

  async function reset() {
    if (!confirm("Je indeling terugzetten naar de standaard?")) return;
    await saveLayout(null, true);
    router.refresh();
  }

  async function togglePinned(id: string) {
    const next = pinnedByManager.includes(id)
      ? pinnedByManager.filter((x) => x !== id)
      : [...pinnedByManager, id];
    const previous = pinnedByManager;
    setPinnedByManager(next);
    setStatus("saving");
    const ok = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinnedDashboardBlocks: next }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok) setPinnedByManager(previous);
    setStatus(ok ? "saved" : "error");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {status === "saving" && <span className="text-xs text-ink/40">Opslaan...</span>}
        {status === "saved" && <span className="text-xs text-awning">Opgeslagen</span>}
        {status === "error" && <span className="text-xs text-red-600">Opslaan mislukt</span>}
        <button
          type="button"
          onClick={() => {
            setEditing((e) => !e);
            setAdding(false);
          }}
          className={`rounded-full border px-3.5 py-1.5 text-sm ${
            editing ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
          }`}
        >
          {editing ? "Klaar" : "Aanpassen"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pinnedIds.map((id) => {
          const b = byId.get(id);
          if (!b) return null;
          return (
            <BlockShell key={id} block={b} editing={false} locked>
              {nodes[id]}
            </BlockShell>
          );
        })}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ownIds} strategy={rectSortingStrategy}>
            {ownIds.map((id) => {
              const b = byId.get(id);
              if (!b) return null;
              return (
                <SortableBlock
                  key={id}
                  block={b}
                  editing={editing}
                  onRemove={() => remove(id)}
                  isManager={isManager}
                  pinnedForEmployees={pinnedByManager.includes(id)}
                  onTogglePinned={() => togglePinned(id)}
                >
                  {nodes[id] ?? <p className="text-sm text-ink/40">Laden...</p>}
                </SortableBlock>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      {ownIds.length + pinnedIds.length === 0 && (
        <p className="mt-4 rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Je overzicht is leeg. Klik op Aanpassen om blokken toe te voegen.
        </p>
      )}

      {editing && (
        <div className="mt-6 rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setAdding((a) => !a)}
              disabled={available.length === 0}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm hover:border-ink disabled:opacity-40"
            >
              + Blok toevoegen
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-ink/50 hover:text-ink hover:underline"
            >
              Standaardindeling herstellen
            </button>
          </div>
          {available.length === 0 && (
            <p className="mt-3 text-sm text-ink/50">Alle beschikbare blokken staan al op je overzicht.</p>
          )}
          {adding && available.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
              {available.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-ink/50">{b.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => add(b.id)}
                    className="shrink-0 rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper hover:bg-awning"
                  >
                    Toevoegen
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isManager && (
            <p className="mt-4 text-xs text-ink/50">
              Tip: met het speldje op een blok zet je het voor al je medewerkers vast. Dat blok staat dan
              bovenaan hun overzicht en kunnen zij niet verwijderen.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BlockShell({
  block,
  editing,
  locked = false,
  children,
  handle,
  onRemove,
  pin,
}: {
  block: BlockInfo;
  editing: boolean;
  locked?: boolean;
  children: React.ReactNode;
  handle?: React.ReactNode;
  onRemove?: () => void;
  pin?: React.ReactNode;
}) {
  return (
    <section
      className={`h-full rounded-xl border bg-white p-5 ${block.wide ? "sm:col-span-2 xl:col-span-3" : ""} ${
        editing ? "border-dashed border-ink/30" : "border-line"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="flex min-w-0 items-center gap-2">
          {handle}
          <h2 className="font-display text-lg">{block.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {locked && (
            <span
              className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50"
              title="Vastgezet door je manager"
            >
              📌 Vastgezet
            </span>
          )}
          {editing && pin}
          {editing && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
              aria-label={`${block.title} verwijderen`}
            >
              Verwijderen
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function SortableBlock({
  block,
  editing,
  onRemove,
  isManager,
  pinnedForEmployees,
  onTogglePinned,
  children,
}: {
  block: BlockInfo;
  editing: boolean;
  onRemove: () => void;
  isManager: boolean;
  pinnedForEmployees: boolean;
  onTogglePinned: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id, disabled: !editing });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.85 : 1,
      }}
      className={block.wide ? "sm:col-span-2 xl:col-span-3" : ""}
    >
      <BlockShell
        block={{ ...block, wide: false }}
        editing={editing}
        onRemove={onRemove}
        handle={
          editing ? (
            <button
              type="button"
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none rounded px-1 text-lg leading-none text-ink/40 hover:text-ink active:cursor-grabbing"
              aria-label={`${block.title} verplaatsen`}
            >
              ⠿
            </button>
          ) : null
        }
        pin={
          isManager && block.pinnable ? (
            <button
              type="button"
              onClick={onTogglePinned}
              aria-pressed={pinnedForEmployees}
              title="Vastzetten voor medewerkers"
              className={`rounded-full px-2.5 py-0.5 text-xs ${
                pinnedForEmployees ? "bg-ink text-paper" : "border border-line text-ink/60 hover:border-ink"
              }`}
            >
              📌 {pinnedForEmployees ? "Vastgezet" : "Vastzetten"}
            </button>
          ) : null
        }
      >
        {children}
      </BlockShell>
    </div>
  );
}
