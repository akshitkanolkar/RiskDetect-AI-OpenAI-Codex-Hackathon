/**
 * Next.js middleware entry lives at /middleware.ts (project root).
 * Session helpers are implemented in lib/supabase/middleware.ts
 * and re-exported here for a clean import path.
 */
export { updateSession } from "@/lib/supabase/middleware";
