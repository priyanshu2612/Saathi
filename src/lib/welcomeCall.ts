// Tracks the one-time "welcome call" a brand-new seeker gets a few seconds
// after signing up. Lives in its own localStorage key so only genuine
// sign-ups (not logins or existing users) ever see it.

const KEY = "sukoon-welcome-call";

export interface WelcomeCallRecord {
  state: "pending" | "done";
  at: number; // ms timestamp of the sign-up
}

export function readWelcomeCall(): WelcomeCallRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WelcomeCallRecord) : null;
  } catch {
    return null;
  }
}

function write(rec: WelcomeCallRecord) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* storage unavailable — the popup simply won't show */
  }
}

export function markJustSignedUp() {
  write({ state: "pending", at: Date.now() });
}

export function markWelcomeCallDone() {
  const rec = readWelcomeCall();
  write({ state: "done", at: rec?.at ?? Date.now() });
}
