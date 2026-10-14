import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/app/nav";

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  new: "Nuovo",
  to_contact: "Da contattare",
  contacted: "Contattato",
  replied: "Ha risposto",
  sample_sent: "Campione inviato",
  negotiating: "In trattativa",
  partner: "Partner",
  rejected: "Rifiutato",
  not_interested: "Non interessato",
};

export default async function CreatorsPage() {
  const supabase = await createClient();
  const { data: creators, error } = await supabase
    .from("creators")
    .select("id, handle, full_name, follower_count, engagement_rate, score_total, pipeline_status")
    .order("score_total", { ascending: false, nullsFirst: false });

  if (error) {
    return <p className="p-8 text-red-500">Errore nel caricare i creator: {error.message}</p>;
  }

  return (
    <div>
      <Nav />
      <div className="p-8">
        <h1 className="mb-6 text-2xl font-semibold">Influencer ({creators?.length ?? 0})</h1>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Handle</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Follower</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Punteggio</TableHead>
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/creators/${c.id}`} className="hover:underline">
                    @{c.handle}
                  </Link>
                </TableCell>
                <TableCell>{c.full_name ?? "—"}</TableCell>
                <TableCell>{c.follower_count?.toLocaleString("it-IT") ?? "—"}</TableCell>
                <TableCell>{c.engagement_rate ? `${c.engagement_rate}%` : "—"}</TableCell>
                <TableCell>{c.score_total ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {STATUS_LABEL[c.pipeline_status] ?? c.pipeline_status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
