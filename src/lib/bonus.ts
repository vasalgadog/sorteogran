export function uniqueParticipants(participants: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const username of participants) {
    const key = username.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(username);
  }

  return result;
}

export function countEntries(participants: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const username of participants) {
    const key = username.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

export function bonusKeySet(bonusUsers: string[]): Set<string> {
  return new Set(bonusUsers.map((username) => username.toLowerCase()));
}

/**
 * Duplica todas las entradas de los usuarios con bonus.
 * Complejidad O(n): una sola pasada y pertenencia al Set en O(1).
 */
export function generateFinalPool(participants: string[], bonusUsers: string[]): string[] {
  if (participants.length === 0) return [];

  const bonus = bonusKeySet(bonusUsers);
  if (bonus.size === 0) return [...participants];

  const pool: string[] = [];

  for (const username of participants) {
    pool.push(username);
    if (bonus.has(username.toLowerCase())) {
      pool.push(username);
    }
  }

  return pool;
}

export function countFinalPool(participants: string[], bonusUsers: string[]): number {
  if (participants.length === 0) return 0;

  const bonus = bonusKeySet(bonusUsers);
  if (bonus.size === 0) return participants.length;

  let total = participants.length;

  for (const username of participants) {
    if (bonus.has(username.toLowerCase())) {
      total += 1;
    }
  }

  return total;
}
