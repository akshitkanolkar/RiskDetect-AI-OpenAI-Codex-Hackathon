import { logInfo } from "@/lib/api/response";

let urlhausCache: { at: number; hosts: Set<string> } | null = null;
let openPhishCache: { at: number; urls: Set<string> } | null = null;

const CACHE_MS = 1000 * 60 * 30;

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SafeLensAI/1.0" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkUrlhaus(domain: string): Promise<boolean> {
  try {
    if (!urlhausCache || Date.now() - urlhausCache.at > CACHE_MS) {
      const text = await fetchText("https://urlhaus.abuse.ch/downloads/hostfile/");
      const hosts = new Set(
        text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => line.replace(/^127\.0\.0\.1\s+/, "").toLowerCase()),
      );
      urlhausCache = { at: Date.now(), hosts };
      logInfo("threat-intel", "URLHaus hostfile refreshed", { count: hosts.size });
    }
    return urlhausCache.hosts.has(domain.toLowerCase());
  } catch {
    return false;
  }
}

export async function checkOpenPhish(normalizedUrl: string): Promise<boolean> {
  try {
    if (!openPhishCache || Date.now() - openPhishCache.at > CACHE_MS) {
      const text = await fetchText("https://openphish.com/feed.txt");
      const urls = new Set(
        text
          .split("\n")
          .map((line) => line.trim().toLowerCase())
          .filter(Boolean),
      );
      openPhishCache = { at: Date.now(), urls };
      logInfo("threat-intel", "OpenPhish feed refreshed", { count: urls.size });
    }
    const target = normalizedUrl.toLowerCase().replace(/\/$/, "");
    for (const entry of openPhishCache.urls) {
      if (entry.includes(target) || target.includes(entry.replace(/\/$/, ""))) {
        return true;
      }
    }
    return openPhishCache.urls.has(normalizedUrl.toLowerCase());
  } catch {
    return false;
  }
}
