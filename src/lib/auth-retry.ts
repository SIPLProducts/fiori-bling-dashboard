/** True for transient token-timing errors (e.g. "JWT issued at future" right after sign-in). */
export function isTransientAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; message?: unknown };
  if (e.code === "PGRST303") return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("issued at future") || msg.includes("jwt") && msg.includes("future");
}

/** Runs a Supabase query, retrying transient auth timing errors (1s, then 2s). Throws other errors. */
export async function withAuthRetry<T>(
  run: () => PromiseLike<{ data: T; error: unknown }>,
  delays: number[] = [1000, 2000],
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await run();
    if (!error) return data;
    if (attempt >= delays.length || !isTransientAuthError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
  }
}
