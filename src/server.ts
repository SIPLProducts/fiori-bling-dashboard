import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

function isSafeDocumentRequest(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return false;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function incidentId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

function logFailure(
  request: Request,
  incident: string,
  stage: string,
  attempt: number,
  error: unknown,
) {
  const url = new URL(request.url);
  console.error(
    `[request-failure] incident=${incident} method=${request.method} path=${url.pathname} stage=${stage} attempt=${attempt}`,
    error,
  );
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry")
      .then((m) => (m.default ?? m) as ServerEntry)
      .catch((error: unknown) => {
        // Do not cache a rejected import forever. A transient startup failure
        // must be recoverable by the next request without restarting the app.
        serverEntryPromise = undefined;
        throw error;
      });
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function isCatastrophicSsrResponse(response: Response): Promise<boolean> {
  if (response.status < 500) return false;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return false;

  const body = await response.clone().text();
  return isH3SwallowedErrorBody(body);
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const incident = incidentId();
    const maxAttempts = isSafeDocumentRequest(request) ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const handler = await getServerEntry();
        const response = await handler.fetch(request, env, ctx);
        if (!(await isCatastrophicSsrResponse(response))) return response;

        const captured = consumeLastCapturedError();
        logFailure(
          request,
          incident,
          "framework-response",
          attempt,
          captured ?? new Error("Framework returned an unhandled HTTPError"),
        );
      } catch (error) {
        logFailure(request, incident, "server-entry", attempt, error);
      }

      // A failed entry or document render must not poison subsequent attempts.
      serverEntryPromise = undefined;
    }

    return new Response(renderErrorPage(incident), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
