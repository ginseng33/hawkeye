"use client";

import { useState } from "react";
import { TopBar } from "@/components/hawkeye/top-bar";
import { CommandPalette } from "@/components/hawkeye/command-palette";
import { LargeTitle } from "@/components/hawkeye/large-title";
import { GroupedList, ListRow } from "@/components/hawkeye/grouped-list";
import { ScorePill } from "@/components/hawkeye/score-pill";
import { StatusPill } from "@/components/hawkeye/status-pill";
import { SegmentedToggle } from "@/components/hawkeye/segmented-control";
import { SearchField } from "@/components/hawkeye/search-field";
import { SidePanel } from "@/components/hawkeye/side-panel";
import { Button } from "@/components/ui/button";

export default function DesignPreviewPage() {
  const [filter, setFilter] = useState<"tutti" | "negozi" | "influencer">("tutti");
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div>
      <TopBar />
      <CommandPalette />

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <LargeTitle
          title="Anteprima design"
          subtitle="Componenti base — Step 1"
          action={<Button onClick={() => setPanelOpen(true)}>Apri sheet</Button>}
        />

        <div className="mb-6 flex items-center gap-3">
          <SegmentedToggle
            options={[
              { label: "Tutti", value: "tutti" },
              { label: "Negozi", value: "negozi" },
              { label: "Influencer", value: "influencer" },
            ]}
            value={filter}
            onChange={setFilter}
          />
          <div className="w-72">
            <SearchField value={search} onChange={setSearch} placeholder="Cerca negozio…" />
          </div>
        </div>

        <GroupedList title="Italia">
          <ListRow
            href="#"
            title="Norse Projects Roma"
            subtitle="Roma · @norseprojects_roma"
            trailing={
              <div className="flex items-center gap-2">
                <ScorePill score={88} />
                <StatusPill status="negotiating" />
              </div>
            }
          />
          <ListRow
            href="#"
            title="Macondo Store"
            subtitle="Verona · @macondostore"
            trailing={
              <div className="flex items-center gap-2">
                <ScorePill score={62} />
                <StatusPill status="new" />
              </div>
            }
          />
        </GroupedList>

        <GroupedList title="Germania">
          <ListRow
            href="#"
            title="Voo Store"
            subtitle="Berlino · @voostore"
            trailing={
              <div className="flex items-center gap-2">
                <ScorePill score={79} />
                <StatusPill status="partner" />
              </div>
            }
          />
          <ListRow
            href="#"
            title="Dark Lands"
            subtitle="Berlino · @darklandsberlin"
            trailing={
              <div className="flex items-center gap-2">
                <ScorePill score={41} />
                <StatusPill status="rejected" />
              </div>
            }
          />
        </GroupedList>
      </div>

      <SidePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        title="Esempio sheet"
        description="Anteprima del pannello laterale"
        footer={<Button onClick={() => setPanelOpen(false)}>Chiudi</Button>}
      >
        <p className="text-sm text-muted-foreground">
          Qui andrà il contenuto, es. ricerca web o bozze messaggi.
        </p>
      </SidePanel>
    </div>
  );
}
