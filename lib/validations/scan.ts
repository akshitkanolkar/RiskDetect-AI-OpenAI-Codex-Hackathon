import { z } from "zod";

export const urlScanSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL is too long")
    .refine((value) => {
      try {
        const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        const parsed = new URL(withProtocol);
        return Boolean(parsed.hostname.includes("."));
      } catch {
        return false;
      }
    }, "Enter a valid URL"),
});

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(4000),
  sessionId: z.string().uuid().optional().nullable(),
  mode: z.enum(["simple", "technical", "checklist"]).optional().default("simple"),
});

export const historyQuerySchema = z.object({
  type: z.enum(["all", "url", "image"]).optional().default("all"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export type UrlScanInput = z.infer<typeof urlScanSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
