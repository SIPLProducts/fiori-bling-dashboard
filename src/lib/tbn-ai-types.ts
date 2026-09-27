import type { UIMessage } from "ai";

export type TbnAiSnapshot = {
  filters: string;
  accountCount: number;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  cumulativeBalance: number;
  debitHeavyAccounts: number;
  creditHeavyAccounts: number;
  zeroBalanceAccounts: number;
  profitCentres: Array<{ name: string; debit: number; credit: number; net: number }>;
  leadingGlAccounts: Array<{ code: string; description: string; debit: number; credit: number; net: number }>;
};

export type TbnAiThread = {
  id: string;
  title: string;
  createdAt: number;
  snapshot: TbnAiSnapshot;
  messages: UIMessage[];
};