import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { APP_NAME } from "@/constants";

export async function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      service: APP_NAME,
      timestamp: new Date().toISOString(),
      supabase: isSupabaseConfigured() ? "configured" : "not_configured",
    },
    error: null,
  });
}
