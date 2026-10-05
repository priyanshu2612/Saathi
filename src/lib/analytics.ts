import { isDemoMode } from "@/lib/supabase/client";
import { trackFunnelStep } from "@/lib/data/backend";

// Bump when the form's steps change, so funnel reports don't mix old and new
// step numbers. Keep in sync with the labels in the saathi_funnel view.
const FORM_VERSION = 2;

const VISITOR_KEY = "saathi-apply-visitor-id";

// Random per-browser id so we can count distinct people, not page loads. Holds
// no personal information.
function getVisitorId(): string | null {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Fire-and-forget: record that this visitor reached a step of the Saathi application. */
export function trackApplyStep(step: number) {
  if (isDemoMode || typeof window === "undefined") return;
  const visitorId = getVisitorId();
  if (!visitorId) return;
  trackFunnelStep(visitorId, step, FORM_VERSION).catch(() => {});
}
