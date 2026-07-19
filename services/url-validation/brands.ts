import type { BrandEntry } from "./types";

/**
 * Configurable trusted-brand registry for impersonation / typosquat detection.
 * Domains are registrable hosts (no www). Keep this list updated as needed.
 */
export const TRUSTED_BRANDS: BrandEntry[] = [
  {
    name: "Microsoft",
    domains: ["microsoft.com", "live.com", "office.com", "outlook.com", "xbox.com"],
    aliases: ["microsoft", "msn", "outlook", "office365"],
  },
  {
    name: "Google",
    domains: ["google.com", "gmail.com", "youtube.com", "googleapis.com", "gstatic.com"],
    aliases: ["google", "gmail", "youtube", "gdrive"],
  },
  {
    name: "Apple",
    domains: ["apple.com", "icloud.com", "me.com"],
    aliases: ["apple", "icloud", "appstore"],
  },
  {
    name: "Amazon",
    domains: ["amazon.com", "amazon.in", "amazonaws.com"],
    aliases: ["amazon", "aws", "prime"],
  },
  {
    name: "PayPal",
    domains: ["paypal.com", "paypal.me"],
    aliases: ["paypal"],
  },
  {
    name: "GitHub",
    domains: ["github.com", "githubusercontent.com", "github.io"],
    aliases: ["github"],
  },
  {
    name: "GitLab",
    domains: ["gitlab.com"],
    aliases: ["gitlab"],
  },
  {
    name: "LinkedIn",
    domains: ["linkedin.com", "lnkd.in"],
    aliases: ["linkedin"],
  },
  {
    name: "Facebook",
    domains: ["facebook.com", "fb.com", "meta.com"],
    aliases: ["facebook", "fb", "meta"],
  },
  {
    name: "Instagram",
    domains: ["instagram.com"],
    aliases: ["instagram", "insta"],
  },
  {
    name: "Netflix",
    domains: ["netflix.com"],
    aliases: ["netflix"],
  },
  {
    name: "OpenAI",
    domains: ["openai.com", "chatgpt.com"],
    aliases: ["openai", "chatgpt"],
  },
  {
    name: "Stripe",
    domains: ["stripe.com"],
    aliases: ["stripe"],
  },
  {
    name: "Razorpay",
    domains: ["razorpay.com"],
    aliases: ["razorpay"],
  },
  {
    name: "PhonePe",
    domains: ["phonepe.com"],
    aliases: ["phonepe"],
  },
  {
    name: "Paytm",
    domains: ["paytm.com"],
    aliases: ["paytm"],
  },
  {
    name: "Discord",
    domains: ["discord.com", "discord.gg"],
    aliases: ["discord"],
  },
  {
    name: "Slack",
    domains: ["slack.com"],
    aliases: ["slack"],
  },
  {
    name: "Notion",
    domains: ["notion.so", "notion.com"],
    aliases: ["notion"],
  },
  {
    name: "Vercel",
    domains: ["vercel.com", "vercel.app"],
    aliases: ["vercel"],
  },
  {
    name: "Cloudflare",
    domains: ["cloudflare.com"],
    aliases: ["cloudflare"],
  },
  {
    name: "Supabase",
    domains: ["supabase.com", "supabase.co"],
    aliases: ["supabase"],
  },
  {
    name: "X / Twitter",
    domains: ["x.com", "twitter.com"],
    aliases: ["twitter"],
  },
  {
    name: "WhatsApp",
    domains: ["whatsapp.com", "wa.me"],
    aliases: ["whatsapp"],
  },
  {
    name: "Dropbox",
    domains: ["dropbox.com"],
    aliases: ["dropbox"],
  },
  {
    name: "Adobe",
    domains: ["adobe.com"],
    aliases: ["adobe"],
  },
  {
    name: "Chase",
    domains: ["chase.com"],
    aliases: ["chase"],
  },
  {
    name: "Bank of America",
    domains: ["bankofamerica.com"],
    aliases: ["bankofamerica", "bofa"],
  },
];

/** Uncommon / abuse-prone TLDs — raise risk only when combined with impersonation signals. */
export const SUSPICIOUS_TLDS = new Set([
  "xyz",
  "top",
  "click",
  "shop",
  "live",
  "site",
  "online",
  "vip",
  "work",
  "icu",
  "buzz",
  "rest",
  "monster",
  "quest",
  "loan",
  "gdn",
  "cn",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
]);

/** Known URL shorteners — destination cannot be verified without expansion. */
export const SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "bitly.com",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "shorturl.at",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "tiny.cc",
  "rb.gy",
  "s.id",
  "v.gd",
  "clck.ru",
  "short.io",
]);

export const SUSPICIOUS_KEYWORDS = [
  "login",
  "signin",
  "sign-in",
  "verify",
  "secure",
  "account",
  "wallet",
  "bank",
  "banking",
  "payment",
  "gift",
  "update",
  "invoice",
  "authentication",
  "reset-password",
  "reset",
  "password",
  "confirm",
  "suspended",
  "urgent",
  "crypto",
  "airdrop",
  "support",
  "unlock",
  "recovery",
  "credential",
  "otp",
] as const;
