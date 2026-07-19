import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function apiError(
  message: string,
  status = 400,
  code?: string,
) {
  return NextResponse.json(
    {
      data: null,
      error: { message, code, status },
    },
    { status },
  );
}

export function logInfo(scope: string, message: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.info(`[SafeLens:${scope}]`, message, meta ?? "");
}

export function logError(scope: string, message: string, meta?: Record<string, unknown>) {
  console.error(`[SafeLens:${scope}]`, message, meta ?? "");
}
