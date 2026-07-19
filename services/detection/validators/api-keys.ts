import type { EntityType, ValidationResult } from "../types";

export interface ApiKeyMatch {
  type: EntityType;
  provider: string;
  method: string;
}

const PROVIDERS: Array<{
  re: RegExp;
  type: EntityType;
  provider: string;
  method: string;
}> = [
  {
    re: /^sk-(?:proj-)?[A-Za-z0-9_-]{20,}$/,
    type: "api_key",
    provider: "OpenAI",
    method: "OpenAI Key Pattern",
  },
  {
    re: /^sk_live_[A-Za-z0-9]{20,}$/,
    type: "api_key",
    provider: "Stripe",
    method: "Stripe Live Key",
  },
  {
    re: /^sk_test_[A-Za-z0-9]{20,}$/,
    type: "api_key",
    provider: "Stripe",
    method: "Stripe Test Key",
  },
  {
    re: /^rk_live_[A-Za-z0-9]{20,}$/,
    type: "api_key",
    provider: "Stripe",
    method: "Stripe Restricted Key",
  },
  { re: /^AKIA[0-9A-Z]{16}$/, type: "aws_key", provider: "AWS", method: "AWS Access Key ID" },
  { re: /^ASIA[0-9A-Z]{16}$/, type: "aws_key", provider: "AWS", method: "AWS Temporary Key ID" },
  {
    re: /^gh[pousr]_[A-Za-z0-9_]{36,}$/,
    type: "github_token",
    provider: "GitHub",
    method: "GitHub Token",
  },
  {
    re: /^github_pat_[A-Za-z0-9_]{20,}$/,
    type: "github_token",
    provider: "GitHub",
    method: "GitHub PAT",
  },
  {
    re: /^gho_[A-Za-z0-9_]{36,}$/,
    type: "github_token",
    provider: "GitHub",
    method: "GitHub OAuth Token",
  },
  { re: /^AIza[0-9A-Za-z_-]{35}$/, type: "api_key", provider: "Google", method: "Google API Key" },
  {
    re: /^SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/,
    type: "api_key",
    provider: "SendGrid",
    method: "SendGrid Key",
  },
  { re: /^AC[a-f0-9]{32}$/i, type: "api_key", provider: "Twilio", method: "Twilio SID" },
  {
    re: /^SK[a-f0-9]{32}$/i,
    type: "api_key",
    provider: "Twilio",
    method: "Twilio Auth Token-like",
  },
  {
    re: /^[a-zA-Z0-9_-]{20,}\.(?:firebaseio|firebaseapp)\.com$/,
    type: "api_key",
    provider: "Firebase",
    method: "Firebase URL",
  },
  {
    re: /^sbp_[a-zA-Z0-9]{40,}$/,
    type: "api_key",
    provider: "Supabase",
    method: "Supabase Service Key Prefix",
  },
  {
    re: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    type: "jwt",
    provider: "JWT",
    method: "JWT Structure",
  },
];

export function classifyApiKey(
  value: string,
): (ValidationResult & ApiKeyMatch) | { valid: false; method: string } {
  const trimmed = value.trim();
  for (const p of PROVIDERS) {
    if (p.re.test(trimmed)) {
      return {
        valid: true,
        method: p.method,
        normalizedValue: trimmed,
        type: p.type,
        provider: p.provider,
        detail: p.provider,
      };
    }
  }
  return { valid: false, method: "Provider Key Patterns" };
}

export function validateBearerToken(value: string): ValidationResult {
  const m = value.trim().match(/^Bearer\s+([A-Za-z0-9\-._~+/]+=*)$/i);
  if (!m?.[1] || m[1].length < 16) {
    return { valid: false, method: "Bearer Token" };
  }
  return { valid: true, method: "Bearer Token", normalizedValue: m[1] };
}

export function validatePrivateKey(value: string): ValidationResult {
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(value)) {
    return { valid: true, method: "PEM Private Key Header", normalizedValue: "PRIVATE_KEY_BLOCK" };
  }
  return { valid: false, method: "PEM Private Key Header" };
}

export function validatePasswordLabel(value: string): ValidationResult {
  const m = value.match(/(?:password|passwd|pwd|passphrase)\s*[:=]\s*(\S+)/i);
  if (!m?.[1] || m[1].length < 4) {
    return { valid: false, method: "Password Label" };
  }
  // Reject placeholder-looking values
  if (/^(true|false|null|undefined|\*{3,}|x{3,}|•+)$/i.test(m[1])) {
    return { valid: false, method: "Password Label", detail: "Placeholder" };
  }
  return { valid: true, method: "Password Label", normalizedValue: m[1] };
}
