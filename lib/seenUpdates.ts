/**
 * Browser-only memory of which IT updates an employee has already seen, per ticket.
 * There is no "read" column in the database, so this lives in localStorage (per browser, per user).
 * Every access is wrapped in try/catch: storage can be blocked (private mode) and the app must still work.
 */

type SeenMap = Record<string, number>; // ticketId -> number of IT updates seen

const key = (userId: string) => `deskbot_seen_${userId}`;

function read(userId: string): SeenMap {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) ?? "{}") as SeenMap;
  } catch {
    return {};
  }
}

export function hasUnseenUpdates(userId: string, ticketId: number, itUpdateCount: number): boolean {
  return itUpdateCount > (read(userId)[ticketId] ?? 0);
}

export function markUpdatesSeen(userId: string, ticketId: number, itUpdateCount: number): void {
  try {
    const seen = read(userId);
    seen[ticketId] = itUpdateCount;
    localStorage.setItem(key(userId), JSON.stringify(seen));
  } catch {
    // Storage unavailable: the dot just stays until the next visit.
  }
}
