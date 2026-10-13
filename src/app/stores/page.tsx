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

// Entire page depends on the signed-in user's session; nothing to prerender.
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

export default async function StoresPage() {
  const supabase = await createClient();
  const { data: stores, error } = await supabase
    .from("stores")
    .select("id, name, city, country, instagram_handle, score_total, pipeline_status")
    .order("name");

  if (error) {
    return <p className="p-8 text-red-500">Errore nel caricare i negozi: {error.message}</p>;
  }

  return (
    <div>
      <Nav />
      <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Negozi ({stores?.length ?? 0})</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Città</TableHead>
            <TableHead>Paese</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead>Punteggio</TableHead>
            <TableHead>Stato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores?.map((store) => (
            <TableRow key={store.id}>
              <TableCell className="font-medium">
                <Link href={`/stores/${store.id}`} className="hover:underline">
                  {store.name}
                </Link>
              </TableCell>
              <TableCell>{store.city ?? "—"}</TableCell>
              <TableCell>{store.country ?? "—"}</TableCell>
              <TableCell>
                {store.instagram_handle ? (
                  <a
                    href={store.instagram_handle}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Instagram
                  </a>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{store.score_total ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {STATUS_LABEL[store.pipeline_status] ?? store.pipeline_status}
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
