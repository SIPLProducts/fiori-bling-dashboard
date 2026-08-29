import { createFileRoute } from "@tanstack/react-router";

/**
 * SAP / middleware pushes the ZFISALES report payload here (every 5 minutes).
 * Auth: shared secret in the `X-Sync-Token` header (SAP_SYNC_TOKEN).
 */
export const Route = createFileRoute("/api/public/sap/sync/zfisales")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SAP_SYNC_TOKEN"];
        if (!expected) {
          return Response.json({ error: "Sync token is not configured" }, { status: 503 });
        }
        const provided = request.headers.get("x-sync-token") ?? "";
        if (provided !== expected) {
          return Response.json({ error: "Invalid sync token" }, { status: 401 });
        }

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { mapPayload } = await import("@/lib/zfisales-sync.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const endpoint = "ZFISALES";
        const startedAt = new Date().toISOString();
        const { received, rows, skipped } = mapPayload(payload, endpoint);

        const { data: run } = await supabaseAdmin
          .from("sap_sync_runs")
          .insert({ endpoint, status: "running", started_at: startedAt, records_received: received })
          .select("id")
          .single();

        const finish = async (patch: Record<string, unknown>) => {
          if (run?.id) {
            await supabaseAdmin
              .from("sap_sync_runs")
              .update({ finished_at: new Date().toISOString(), ...patch })
              .eq("id", run.id);
          }
        };

        if (!rows.length) {
          await finish({ status: received ? "error" : "success", error_message: received ? "No mappable rows" : null });
          return Response.json({ received, inserted: 0, updated: 0, skipped }, { status: received ? 422 : 200 });
        }

        try {
          const keys = rows.map((r) => r.record_key);
          const existing = new Set<string>();
          for (let i = 0; i < keys.length; i += 500) {
            const { data } = await supabaseAdmin
              .from("zfisales_detail")
              .select("record_key")
              .in("record_key", keys.slice(i, i + 500));
            for (const r of data ?? []) existing.add(r.record_key);
          }

          for (let i = 0; i < rows.length; i += 500) {
            const { error } = await supabaseAdmin
              .from("zfisales_detail")
              .upsert(rows.slice(i, i + 500), { onConflict: "record_key" });
            if (error) throw error;
          }

          const updated = rows.filter((r) => existing.has(r.record_key)).length;
          const inserted = rows.length - updated;
          await finish({ status: "success", records_inserted: inserted, records_updated: updated });
          return Response.json({ received, inserted, updated, skipped });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Sync failed";
          await finish({ status: "error", error_message: message });
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
