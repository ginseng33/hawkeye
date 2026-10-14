"use client";

import { useMemo, useState } from "react";
import { GroupedList, ListRow } from "@/components/hawkeye/grouped-list";
import { ScorePill } from "@/components/hawkeye/score-pill";
import { SegmentedToggle } from "@/components/hawkeye/segmented-control";
import { SearchField } from "@/components/hawkeye/search-field";
import { StatusPill } from "@/components/hawkeye/status-pill";

type Creator = {
  id: string;
  handle: string;
  full_name: string | null;
  follower_count: number | null;
  score_total: number | null;
  pipeline_status: string;
};

type Filter = "tutti" | "da_valutare" | "partner";

export function CreatorsListClient({ creators }: { creators: Creator[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("tutti");

  const filtered = useMemo(() => {
    return creators.filter((c) => {
      const matchesSearch =
        !search ||
        c.handle.toLowerCase().includes(search.toLowerCase()) ||
        (c.full_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "tutti" ||
        (filter === "partner" && c.pipeline_status === "partner") ||
        (filter === "da_valutare" && c.score_total === null);
      return matchesSearch && matchesFilter;
    });
  }, [creators, search, filter]);

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
          <SearchField value={search} onChange={setSearch} placeholder="Cerca handle o nome…" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun influencer trovato.</p>
      ) : (
        <GroupedList>
          {filtered.map((creator) => (
            <ListRow
              key={creator.id}
              href={`/creators/${creator.id}`}
              title={`@${creator.handle}`}
              subtitle={
                creator.full_name
                  ? `${creator.full_name} · ${(creator.follower_count ?? 0).toLocaleString("it-IT")} follower`
                  : `${(creator.follower_count ?? 0).toLocaleString("it-IT")} follower`
              }
              trailing={
                <div className="flex items-center gap-2">
                  <ScorePill score={creator.score_total} />
                  <StatusPill status={creator.pipeline_status} />
                </div>
              }
            />
          ))}
        </GroupedList>
      )}
    </div>
  );
}
