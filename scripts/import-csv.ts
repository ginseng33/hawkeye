// One-off import: reads reference-data/negozi-iniziali.csv and inserts
// each row into the `stores` table. Run with: npm run import:csv
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CsvRow = {
  Nome: string;
  Città: string;
  Paese: string;
  Instagram: string;
  Email: string;
  Segnato: string;
  Note: string;
};

async function main() {
  const csvPath = path.join(
    process.cwd(),
    "reference-data",
    "negozi-iniziali.csv"
  );
  const csvText = readFileSync(csvPath, "utf-8");
  const { data } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = data
    .filter((row) => row.Nome)
    .map((row) => ({
      name: row.Nome.trim(),
      city: row.Città?.trim() || null,
      country: row.Paese?.trim() || null,
      instagram_handle: row.Instagram?.trim() || null,
      email: row.Email?.trim() || null,
      notes: row.Note?.trim() || null,
      pipeline_status:
        row.Segnato?.trim().toLowerCase() === "sì" ? "contacted" : "new",
      source: "csv" as const,
    }));

  console.log(`Importing ${rows.length} stores...`);

  const { error, count } = await supabase
    .from("stores")
    .insert(rows, { count: "exact" });

  if (error) {
    console.error("Import failed:", error.message);
    process.exit(1);
  }

  console.log(`Imported ${count} stores successfully.`);
}

main();
