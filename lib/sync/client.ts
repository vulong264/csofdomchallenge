/**
 * Browser-side helpers for `/api/progress`. The shared family code lives in
 * localStorage and rides along as a header; the Firestore credentials stay on
 * the server. Safe to import from client components.
 */
import type { LearnerProgress } from "@/lib/progress/types";
import { ACCESS_CODE_HEADER, type ConflictResponse, type PullResponse, type PushResponse } from "./types";

const CODE_KEY = "csofdoom.accesscode";

export function getAccessCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CODE_KEY);
}

export function setAccessCode(code: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(CODE_KEY, code);
}

export function clearAccessCode(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(CODE_KEY);
}

function headers(): HeadersInit {
  const code = getAccessCode();
  return code ? { "Content-Type": "application/json", [ACCESS_CODE_HEADER]: code } : { "Content-Type": "application/json" };
}

export type PullResult =
  | { kind: "unconfigured" } // server has no sync — stay local-only
  | { kind: "needs-code" } // sync on, but our code is missing/wrong
  | { kind: "unavailable" } // transient (network / Firestore down)
  | { kind: "ok"; progress: LearnerProgress | null; updatedISO: string | null };

export async function pullProgress(signal?: AbortSignal): Promise<PullResult> {
  let res: Response;
  try {
    res = await fetch("/api/progress", { method: "GET", headers: headers(), signal });
  } catch {
    return { kind: "unavailable" };
  }
  if (res.status === 401) return { kind: "needs-code" };
  if (!res.ok) return { kind: "unavailable" };
  const body = (await res.json()) as PullResponse;
  if (!body.configured) return { kind: "unconfigured" };
  return { kind: "ok", progress: body.progress, updatedISO: body.updatedISO };
}

export type PushResult =
  | { kind: "ok"; updatedISO: string }
  | { kind: "conflict"; progress: LearnerProgress; updatedISO: string }
  | { kind: "needs-code" }
  | { kind: "unavailable" };

export async function pushProgress(progress: LearnerProgress, signal?: AbortSignal): Promise<PushResult> {
  let res: Response;
  try {
    res = await fetch("/api/progress", {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ progress }),
      signal,
    });
  } catch {
    return { kind: "unavailable" };
  }
  if (res.status === 401) return { kind: "needs-code" };
  if (res.status === 409) {
    const body = (await res.json()) as ConflictResponse;
    return { kind: "conflict", progress: body.progress, updatedISO: body.updatedISO };
  }
  if (!res.ok) return { kind: "unavailable" };
  const body = (await res.json()) as PushResponse;
  return { kind: "ok", updatedISO: body.updatedISO };
}

/** Probe whether the stored code is accepted (used by the access-code gate). */
export async function verifyAccessCode(code: string): Promise<"ok" | "bad" | "unconfigured" | "unavailable"> {
  let res: Response;
  try {
    res = await fetch("/api/progress", {
      method: "GET",
      headers: { "Content-Type": "application/json", [ACCESS_CODE_HEADER]: code },
    });
  } catch {
    return "unavailable";
  }
  if (res.status === 401) return "bad";
  if (!res.ok) return "unavailable";
  const body = (await res.json()) as PullResponse;
  return body.configured ? "ok" : "unconfigured";
}
