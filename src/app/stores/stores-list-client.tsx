"use client";

import { useMemo, useState } from "react";
import { GroupedList, ListRow } from "@/components/hawkeye/grouped-list";
import { ScorePill } from "@/components/hawkeye/score-pill";
import { SegmentedToggle } from "@/components/hawkeye/segmented-control";
import { SearchField } from "@/components/hawkeye/search-field";
import { StatusPill } from "@/components/hawkeye/status-pill";

type Store = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  score_total: number | null;
  pipeline_status: string;
};

type Filter = "tutti" | "da_valutare" | "partner";

export function StoresListClient({ stores }: { stores: Store[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("tutti");

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.city ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "tutti" ||
        (filter === "partner" && s.pipeline_status === "partner") ||
        (filter === "da_valutare" && s.score_total === null);
      return matchesSearch && matchesFilter;
    });
  }, [stores, search, filter]);

  const byCountry = useMemo(() => {
    const groups = new Map<string, Store[]>();
    for (const s of filtered) {
      const key = s.country ?? "Paese sconosciuto";
      const list = groups.get(key) ?? [];
      list.push(s);
      groups.set(key, list);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <SegmentedToggle
          options={[
            { label: "Tutti", value: "tutti" },
            { label: "Da valutare", value: "da_valutare" },
            { label: "Partner", value: "partner" },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="w-72">
          <SearchField value={search} onChange={setSearch} placeholder="Cerca negozio o città…" />
        </div>
      </div>

      {byCountry.length === 0 && (
        <p className="text-sm text-muted-foreground">Nessun negozio trovato.</p>
      )}

      {byCountry.map(([country, list]) => (
        <GroupedList key={country} title={country}>
          {list.map((store) => (
            <ListRow
              key={store.id}
              href={`/stores/${store.id}`}
              title={store.name}
              subtitle={store.city ?? undefined}
              trailing={
                <div className="flex items-center gap-2">
                  <ScorePill score={store.score_total} />
                  <StatusPill status={store.pipeline_status} />
                </div>
              }
            />
          ))}
        </GroupedList>
      ))}
    </div>
  );
}
