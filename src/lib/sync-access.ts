/** Roles allowed to trigger an on-screen SAP Sync. */
export const SYNC_ROLE_KEYS = ["admin", "super_admin"] as const;

export function canSyncSap(roleKeys: readonly string[] | null | undefined): boolean {
  return (roleKeys ?? []).some((key) => (SYNC_ROLE_KEYS as readonly string[]).includes(key));
}
