import type { RiskLevel } from "@/types";

/**
 * Modular URL reputation layer.
 * Concrete providers (Safe Browsing, VirusTotal, OpenPhish, etc.) can be plugged in later.
 */

export type ReputationProviderId =
  | "openphish"
  | "urlhaus"
  | "google-safe-browsing"
  | "virustotal"
  | "phishtank"
  | "cisco-talos"
  | "cloudflare-radar";

export interface ReputationSignal {
  provider: ReputationProviderId;
  listed: boolean;
  severity?: RiskLevel;
  detail?: string;
  checkedAt: string;
}

export interface ReputationLookupResult {
  url: string;
  domain: string;
  signals: ReputationSignal[];
  /** True when any provider flagged the URL/domain. */
  anyListed: boolean;
}

export interface ReputationProvider {
  id: ReputationProviderId;
  enabled: boolean;
  lookup(url: string, domain: string): Promise<ReputationSignal>;
}

/**
 * Orchestrates optional reputation providers. Disabled providers are skipped.
 * Current default: no remote providers enabled (heuristic engine remains primary).
 */
export class UrlReputationService {
  constructor(private readonly providers: ReputationProvider[] = []) {}

  async lookup(url: string, domain: string): Promise<ReputationLookupResult> {
    const active = this.providers.filter((p) => p.enabled);
    const signals = await Promise.all(
      active.map(async (p) => {
        try {
          return await p.lookup(url, domain);
        } catch {
          return {
            provider: p.id,
            listed: false,
            detail: "Provider error — skipped",
            checkedAt: new Date().toISOString(),
          } satisfies ReputationSignal;
        }
      }),
    );

    return {
      url,
      domain,
      signals,
      anyListed: signals.some((s) => s.listed),
    };
  }
}

/** Shared singleton — register providers at boot when API keys exist. */
export const urlReputationService = new UrlReputationService([]);
