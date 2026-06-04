export interface RecentAccount {
  email: string;
  label?: string;
  role?: string;
  lastUsedAt: number;
}

const STORAGE_KEY = "controme.recentAccounts";
const MAX_RECENT_ACCOUNTS = 8;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getRecentAccounts(): RecentAccount[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Partial<RecentAccount>[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((account): account is RecentAccount => {
        return Boolean(account.email && account.lastUsedAt);
      })
      .map((account) => ({
        ...account,
        email: normalizeEmail(account.email),
      }))
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, MAX_RECENT_ACCOUNTS);
  } catch {
    return [];
  }
}

export function saveRecentAccount(input: {
  email: string;
  label?: string;
  role?: string;
}): RecentAccount[] {
  if (!isBrowser()) return [];

  const email = normalizeEmail(input.email);
  if (!email) return getRecentAccounts();

  const nextAccount: RecentAccount = {
    email,
    label: input.label,
    role: input.role,
    lastUsedAt: Date.now(),
  };

  const accounts = [
    nextAccount,
    ...getRecentAccounts().filter((account) => account.email !== email),
  ].slice(0, MAX_RECENT_ACCOUNTS);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return accounts;
}

export function removeRecentAccount(email: string): RecentAccount[] {
  if (!isBrowser()) return [];

  const normalizedEmail = normalizeEmail(email);
  const accounts = getRecentAccounts().filter(
    (account) => account.email !== normalizedEmail,
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return accounts;
}
