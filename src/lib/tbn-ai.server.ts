import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { createGatewayRunIdFetch, incomingGatewayRunId, withGatewayRunId } from "./ai-gateway-run-id.server";

const number = z.number().finite();
const snapshotSchema = z.object({
  filters: z.string(), accountCount: z.number().int().nonnegative(), totalDebit: number,
  totalCredit: number, netBalance: number, cumulativeBalance: number,
  debitHeavyAccounts: z.number().int().nonnegative(), creditHeavyAccounts: z.number().int().nonnegative(),
  zeroBalanceAccounts: z.number().int().nonnegative(),
  profitCentres: z.array(z.object({ name: z.string(), debit: number, credit: number, net: number })),
  leadingGlAccounts: z.array(z.object({ code: z.string(), description: z.string(), debit: number, credit: number, net: number })),
});
const bodySchema = z.object({ threadId: z.string(), messages: z.array(z.unknown()), snapshot: snapshotSchema });

function safeError(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "The TBN assistant could not complete this analysis.";
}

async function authorize(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token.split(".").length !== 3) return false;
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return false;
  const client = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return false;
  const { data: allowed } = await client.rpc("has_screen", { _user_id: data.user.id, _screen: "fi.tbn" });
  return Boolean(allowed);
}

export async function handleTbnAssistant(request: Request) {
  if (!(await authorize(request))) return Response.json({ message: "You do not have access to TBN analysis." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "The TBN analysis request is invalid." }, { status: 400 });
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ message: "Lovable AI is not configured for this portal." }, { status: 401 });

  const messages = parsed.data.messages as UIMessage[];
  const snapshot = JSON.stringify(parsed.data.snapshot);
  const runId = createGatewayRunIdFetch(incomingGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runId.fetch,
  });
  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: `You are the TBN Finance Analyst for HBL MIS Portal. Answer only from the supplied current filtered ZTBN dashboard snapshot. Explain debit, credit, net-balance, profit-centre concentration, leading GL accounts, and alert counts in clear finance language. Cite exact dashboard values using Indian number formatting and rupees where relevant. Do not claim causes that the data does not prove. ZTBN has no date dimension, so never describe chronological, monthly, quarterly, or year-over-year trends; when asked about a time trend, state that time-based movement cannot be determined from ZTBN and explain the current cross-sectional pattern instead. Keep answers concise and decision-oriented.\n\nCURRENT DASHBOARD SNAPSHOT:\n${snapshot}`,
      messages: await convertToModelMessages(messages),
      abortSignal: request.signal,
      maxRetries: 2,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    const response = result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: true });
    return withGatewayRunId(response, runId);
  } catch (error) {
    return Response.json({ message: safeError(error) }, { status: 500 });
  }
}