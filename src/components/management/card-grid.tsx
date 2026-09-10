import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export type DashboardCard = {
  /** Stable id used to persist the arrangement. */
  id: string;
  /** Column span inside the 12-column grid at xl and above. */
  span: number;
  node: ReactNode;
};

const STORAGE_KEY = "mgmt-card-order";

export function readCardOrder(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeCardOrder(order: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    /* storage unavailable — arrangement simply is not remembered */
  }
}

export function clearCardOrder() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** 12-column grid whose cards can be dragged into any position, tiles and charts alike. */
export function DraggableCardGrid({
  cards,
  version = 0,
}: {
  cards: DashboardCard[];
  /** Bump to re-read the stored order (used by "Reset layout"). */
  version?: number;
}) {
  const ids = useMemo(() => cards.map((card) => card.id), [cards]);
  const [order, setOrder] = useState<string[]>(ids);
  const dragId = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  useEffect(() => {
    const saved = readCardOrder().filter((id) => ids.includes(id));
    setOrder([...saved, ...ids.filter((id) => !saved.includes(id))]);
  }, [ids, version]);

  const reorder = useCallback((targetId: string) => {
    const sourceId = dragId.current;
    if (!sourceId || sourceId === targetId) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      writeCardOrder(next);
      return next;
    });
  }, []);

  const byId = new Map(cards.map((card) => [card.id, card]));
  const ordered = order.map((id) => byId.get(id)).filter((card): card is DashboardCard => !!card);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-12">
      {ordered.map((card) => (
        <div
          key={card.id}
          draggable
          onDragStart={(event) => {
            dragId.current = card.id;
            setDragging(card.id);
            event.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            dragId.current = null;
            setDragging(null);
            setOver(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (over !== card.id) setOver(card.id);
          }}
          onDragLeave={() => setOver((prev) => (prev === card.id ? null : prev))}
          onDrop={(event) => {
            event.preventDefault();
            reorder(card.id);
            dragId.current = null;
            setDragging(null);
            setOver(null);
          }}
          title="Drag to rearrange"
          className={[
            "min-w-0 cursor-grab rounded-xl transition-all active:cursor-grabbing",
            "col-span-1 sm:col-span-2",
            LG_SPAN[card.span] ?? "lg:col-span-6",
            XL_SPAN[card.span] ?? "xl:col-span-6",
            dragging === card.id ? "opacity-50" : "",
            over === card.id && dragging && dragging !== card.id
              ? "ring-2 ring-[#1769E8] ring-offset-2 ring-offset-[#F7F9FC]"
              : "",
          ].join(" ")}
        >
          {card.node}
        </div>
      ))}
    </div>
  );
}
