type Entry = { count: number; reset: number };
const memory = new Map<string, Entry>();
export async function rateLimit(key: string, max = Number(process.env.RATE_LIMIT_MAX || 30), windowSeconds = Number(process.env.RATE_LIMIT_WINDOW || 60)) {
  const now = Date.now(); const current = memory.get(key);
  if (!current || current.reset <= now) { memory.set(key, { count: 1, reset: now + windowSeconds * 1000 }); return { success: true, remaining: max - 1 }; }
  if (current.count >= max) return { success: false, remaining: 0 };
  current.count += 1; return { success: true, remaining: max - current.count };
}
