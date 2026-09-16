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
        const requestSnapshot = { source: "sap-push" };
        const { received, rows, skipped, invalid, duplicates, syncScopeKey, snapshotId } = mapPayload(
          payload,
          endpoint,
          requestSnapshot,
        );

        const { data: run } = await supabaseAdmin
          .from("sap_sync_runs")
          .insert({
            endpoint,
            status: "running",
            started_at: startedAt,
            records_received: received,
            records_invalid: invalid,
            records_skipped: skipped,
            request_snapshot: requestSnapshot,
            sync_scope_key: syncScopeKey,
            snapshot_id: snapshotId,
          })
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
          return Response.json({ received, stored: 0, replaced: 0, skipped, invalid }, { status: received ? 422 : 200 });
        }

        try {
          for (let i = 0; i < rows.length; i += 500) {
            const { error } = await supabaseAdmin
              .from("zfisales_detail")
              .insert(rows.slice(i, i + 500) as never);
            if (error) throw error;
          }
          const { data: replaced, error: activateError } = await supabaseAdmin.rpc("activate_zfisales_snapshot", {
            _scope_key: syncScopeKey,
            _snapshot_id: snapshotId,
            _expected_count: rows.length,
          });
          if (activateError) throw activateError;
          await finish({
            status: "success",
            records_stored: rows.length,
            records_replaced: replaced ?? 0,
            records_invalid: invalid,
            records_inserted: rows.length,
            records_updated: 0,
            records_skipped: skipped,
            error_message: `${rows.length} stored; ${replaced ?? 0} replaced; ${duplicates} repeated occurrences preserved; ${invalid} invalid`,
          });
          return Response.json({ received, stored: rows.length, replaced: replaced ?? 0, skipped, invalid, duplicates });
        } catch (err) {
          await supabaseAdmin.from("zfisales_detail").delete().eq("snapshot_id", snapshotId).eq("is_active_snapshot", false);
          const message = err instanceof Error ? err.message : "Sync failed";
          await finish({ status: "error", error_message: message });
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
