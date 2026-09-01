import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled pull: calls the SAP endpoint through the middleware and upserts
 * the rows into `zfisales_detail`. Invoked by pg_cron every 10 minutes.
 * Auth: shared secret in the `X-Sync-Token` header (SAP_SYNC_TOKEN).
 */
export const Route = createFileRoute("/api/public/sap/pull/zfisales")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SAP_SYNC_TOKEN"];
        if (!expected) return Response.json({ error: "Sync token is not configured" }, { status: 503 });
        if ((request.headers.get("x-sync-token") ?? "") !== expected) {
          return Response.json({ error: "Invalid sync token" }, { status: 401 });
        }

        let endpointName = "Sales_Reports_KPI";
        try {
          const body = (await request.json()) as { endpoint?: string };
          if (body?.endpoint) endpointName = String(body.endpoint);
        } catch {
          /* empty body is fine */
        }

        const { pullSapEndpoint } = await import("@/lib/sap-pull.server");
        const result = await pullSapEndpoint(endpointName);
        const status = result.status === "error" ? 502 : 200;
        return Response.json({ endpoint: endpointName, ...result }, { status });
      },
    },
  },
});
