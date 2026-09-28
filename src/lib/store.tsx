"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MOCK_MENTORS, FREE_TRIAL_COINS } from "./mock-data";
import {
  ChatMessage,
  CoinTransaction,
  Mentor,
  MoodTag,
  SessionMode,
  SessionRecord,
} from "./types";
import { isDemoMode } from "./supabase/client";
import { fetchMentors } from "./data/mentors";
import {
  claimMentorInvite as claimMentorInviteRemote,
  endSessionRemote,
  ensureSeekerId,
  getAccount,
  getMentorId,
  getSeekerId,
  SaathiApplicationDraft,
  sessionTick,
  setMentorOnlineRemote,
  startSessionRemote,
  submitSaathiApplication as submitSaathiApplicationRemote,
  updateMentorProfileRemote,
} from "./data/backend";

const STORAGE_KEY = "comfort-companion-demo-state-v1";

export interface MentorProfileDraft {
  name: string;
  tagline: string;
  bio: string;
  tags: MoodTag[];
  languages: string[];
  rateChat: number;
  rateAudio: number;
  rateVideo: number;
  photoUrl: string;
  photos: string[];
  age: number;
  gender: string;
  nationality: string;
  bornCity: string;
  qualification: string;
  college: string;
  school: string;
  religion: string;
  communicationTags: string[];
  personalityTags: string[];
}

export type HomeFilter = MoodTag | "all";

interface PersistedState {
  isAuthenticated: boolean;
  phoneNumber: string;
  coinBalance: number;
  transactions: CoinTransaction[];
  selectedTags: MoodTag[];
  homeFilter: HomeFilter;
  savedMentorIds: string[];
  sessions: SessionRecord[];
  checkInDays: string[]; // ISO date strings, this week
  mentorClaimed: boolean;
  mentorOnline: boolean;
  mentorProfile: MentorProfileDraft;
  mentorEarnings: number;
  mentorSessionsHelped: number;
}

const DEFAULT_MENTOR_PHOTO =
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop";

const DEFAULT_MENTOR_PROFILE: MentorProfileDraft = {
  name: "Priya",
  tagline: "",
  bio: "",
  tags: ["loneliness", "just_talk"],
  languages: ["English"],
  rateChat: 8,
  rateAudio: 16,
  rateVideo: 28,
  photoUrl: DEFAULT_MENTOR_PHOTO,
  photos: [DEFAULT_MENTOR_PHOTO],
  age: 24,
  gender: "",
  nationality: "",
  bornCity: "",
  qualification: "",
  college: "",
  school: "",
  religion: "",
  communicationTags: [],
  personalityTags: [],
};

const DEFAULT_STATE: PersistedState = {
  isAuthenticated: false,
  phoneNumber: "",
  coinBalance: FREE_TRIAL_COINS,
  transactions: [
    {
      id: "tx-welcome",
      amount: FREE_TRIAL_COINS,
      type: "free_credit",
      // Fixed, not `new Date()`: this constant is evaluated once at module
      // load on both the server and the client, at two different real
      // moments — a live timestamp here would mismatch during hydration.
      // loadState() overwrites it with the real localStorage value on mount.
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  selectedTags: [],
  homeFilter: "all",
  savedMentorIds: [],
  sessions: [],
  checkInDays: [],
  mentorClaimed: false,
  mentorOnline: false,
  mentorProfile: DEFAULT_MENTOR_PROFILE,
  mentorEarnings: 0,
  mentorSessionsHelped: 0,
};

interface AppState extends PersistedState {
  hydrated: boolean;
  mentors: Mentor[];
  requestOtp: (phone: string) => boolean;
  verifyOtp: (code: string) => boolean;
  logOut: () => void;
  setHomeFilter: (filter: HomeFilter) => void;
  addCoins: (amount: number, type: CoinTransaction["type"]) => void;
  spendCoins: (amount: number, sessionId?: string) => Promise<boolean>;
  toggleTag: (tag: MoodTag) => void;
  setTags: (tags: MoodTag[]) => void;
  toggleSaveMentor: (mentorId: string) => void;
  isSaved: (mentorId: string) => boolean;
  startSession: (mentorId: string, mode?: SessionMode) => Promise<SessionRecord | null>;
  endSession: (sessionId: string, totalCoinsCharged: number) => Promise<void>;
  recordCheckIn: () => void;
  checkInsThisWeek: number;
  claimMentorInvite: (
    accessCode: string,
    phone?: string
  ) => Promise<{ ok: boolean; name?: string; error?: string }>;
  submitSaathiApplication: (
    draft: SaathiApplicationDraft
  ) => Promise<{ ok: boolean; error?: string }>;
  setMentorOnline: (online: boolean) => void;
  updateMentorProfile: (draft: Partial<MentorProfileDraft>) => void;
  simulateEarning: (coins: number) => void;
  mentorsLoading: boolean;
}

const AppStateContext = createContext<AppState | null>(null);

function loadState(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      // Shallow spread above replaces nested objects wholesale, so a
      // mentorProfile saved before new fields were added would otherwise
      // come back missing them — merge it one level deeper instead.
      mentorProfile: { ...DEFAULT_MENTOR_PROFILE, ...(parsed.mentorProfile ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>(isDemoMode ? MOCK_MENTORS : []);
  const [mentorsLoading, setMentorsLoading] = useState(!isDemoMode);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (isDemoMode) return;
    let cancelled = false;
    setMentorsLoading(true);
    fetchMentors()
      .then((list) => {
        if (!cancelled) setMentors(list);
      })
      .finally(() => {
        if (!cancelled) setMentorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auth is mocked (see verifyOtp below), but the real backend still needs a
  // profile/wallet row to exist for this device. Bootstraps it once the
  // seeker "signs in" and hydrates coinBalance/transactions/sessions from
  // the server, which is the source of truth in real mode.
  useEffect(() => {
    if (isDemoMode || !hydrated || !state.isAuthenticated) return;
    let cancelled = false;
    ensureSeekerId()
      .then((seekerId) => getAccount(seekerId))
      .then((account) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          coinBalance: account.coinBalance,
          transactions: account.transactions,
          sessions: account.sessions,
        }));
      })
      .catch(() => {
        /* best-effort hydrate; UI keeps whatever it had locally */
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, state.isAuthenticated]);

  const requestOtp = useCallback((phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return false;
    setState((prev) => ({ ...prev, phoneNumber: digits }));
    return true;
  }, []);

  const verifyOtp = useCallback((code: string) => {
    if (code.replace(/\D/g, "").length < 4) return false;
    setState((prev) => ({ ...prev, isAuthenticated: true }));
    return true;
  }, []);

  const logOut = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
  }, []);

  const setHomeFilter = useCallback((filter: HomeFilter) => {
    setState((prev) => ({ ...prev, homeFilter: filter }));
  }, []);

  const addCoins = useCallback((amount: number, type: CoinTransaction["type"]) => {
    setState((prev) => ({
      ...prev,
      coinBalance: prev.coinBalance + amount,
      transactions: [
        { id: `tx-${Date.now()}`, amount, type, createdAt: new Date().toISOString() },
        ...prev.transactions,
      ],
    }));
  }, []);

  const spendCoins = useCallback(
    async (amount: number, sessionId?: string) => {
      if (!isDemoMode && sessionId) {
        try {
          const result = await sessionTick(sessionId);
          setState((prev) => ({ ...prev, coinBalance: result.coinBalance }));
          return !result.ended;
        } catch {
          return false;
        }
      }
      let ok = false;
      setState((prev) => {
        if (prev.coinBalance < amount) return prev;
        ok = true;
        return {
          ...prev,
          coinBalance: prev.coinBalance - amount,
          transactions: [
            {
              id: `tx-${Date.now()}`,
              amount: -amount,
              type: "session_spend",
              createdAt: new Date().toISOString(),
              relatedSessionId: sessionId,
            },
            ...prev.transactions,
          ],
        };
      });
      return ok;
    },
    []
  );

  const toggleTag = useCallback((tag: MoodTag) => {
    setState((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  }, []);

  const setTags = useCallback((tags: MoodTag[]) => {
    setState((prev) => ({ ...prev, selectedTags: tags }));
  }, []);

  const toggleSaveMentor = useCallback((mentorId: string) => {
    setState((prev) => ({
      ...prev,
      savedMentorIds: prev.savedMentorIds.includes(mentorId)
        ? prev.savedMentorIds.filter((id) => id !== mentorId)
        : [...prev.savedMentorIds, mentorId],
    }));
  }, []);

  const isSaved = useCallback(
    (mentorId: string) => state.savedMentorIds.includes(mentorId),
    [state.savedMentorIds]
  );

  const startSession = useCallback(
    async (mentorId: string, mode: SessionMode = "chat"): Promise<SessionRecord | null> => {
      if (!isDemoMode) {
        const seekerId = await ensureSeekerId();
        const session = await startSessionRemote(seekerId, mentorId, mode);
        if (!session) return null;
        setState((prev) => ({ ...prev, sessions: [session, ...prev.sessions] }));
        return session;
      }
      const mentor = MOCK_MENTORS.find((m) => m.id === mentorId);
      if (!mentor) return null;
      const ratePerMinute =
        mode === "video" ? mentor.rateVideo : mode === "audio" ? mentor.rateAudio : mentor.rateChat;
      if (state.coinBalance < ratePerMinute) return null;
      const session: SessionRecord = {
        id: `s-${Date.now()}`,
        mentorId,
        mode,
        startedAt: new Date().toISOString(),
        status: "active",
        totalCoinsCharged: 0,
        ratePerMinute,
      };
      setState((prev) => ({ ...prev, sessions: [session, ...prev.sessions] }));
      return session;
    },
    [state.coinBalance]
  );

  const endSession = useCallback(async (sessionId: string, totalCoinsCharged: number) => {
    if (!isDemoMode) {
      try {
        await endSessionRemote(sessionId);
      } catch {
        /* session may already be completed server-side (e.g. wallet ran out) */
      }
    }
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: "completed", endedAt: new Date().toISOString(), totalCoinsCharged }
          : s
      ),
    }));
  }, []);

  const recordCheckIn = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setState((prev) =>
      prev.checkInDays.includes(today)
        ? prev
        : { ...prev, checkInDays: [...prev.checkInDays, today] }
    );
  }, []);

  const checkInsThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return state.checkInDays.filter((d) => new Date(d) >= weekAgo).length;
  }, [state.checkInDays]);

  const claimMentorInvite = useCallback(
    async (accessCode: string, phone?: string) => {
      const code = accessCode.trim();
      if (code.length < 4) return { ok: false };
      if (!isDemoMode) {
        const result = await claimMentorInviteRemote(code, phone);
        if (!result.ok) return { ok: false, error: result.error };
        setState((prev) => ({
          ...prev,
          mentorClaimed: true,
          mentorProfile: result.name
            ? { ...prev.mentorProfile, name: result.name }
            : prev.mentorProfile,
        }));
        return { ok: true, name: result.name };
      }
      setState((prev) => ({ ...prev, mentorClaimed: true }));
      return { ok: true, name: state.mentorProfile.name };
    },
    [state.mentorProfile.name]
  );

  const submitSaathiApplication = useCallback(async (draft: SaathiApplicationDraft) => {
    if (!isDemoMode) return submitSaathiApplicationRemote(draft);
    return { ok: true };
  }, []);

  const setMentorOnline = useCallback((online: boolean) => {
    setState((prev) => ({ ...prev, mentorOnline: online }));
    if (!isDemoMode) {
      const mentorId = getMentorId();
      if (mentorId) setMentorOnlineRemote(mentorId, online).catch(() => {});
    }
  }, []);

  const updateMentorProfile = useCallback((draft: Partial<MentorProfileDraft>) => {
    setState((prev) => ({
      ...prev,
      mentorProfile: { ...prev.mentorProfile, ...draft },
    }));
    if (!isDemoMode) {
      const mentorId = getMentorId();
      if (mentorId) updateMentorProfileRemote(mentorId, draft).catch(() => {});
    }
  }, []);

  const simulateEarning = useCallback((coins: number) => {
    setState((prev) => ({
      ...prev,
      mentorEarnings: prev.mentorEarnings + coins,
      mentorSessionsHelped: prev.mentorSessionsHelped + 1,
    }));
  }, []);

  const value: AppState = {
    ...state,
    hydrated,
    mentors,
    mentorsLoading,
    requestOtp,
    verifyOtp,
    logOut,
    setHomeFilter,
    addCoins,
    spendCoins,
    toggleTag,
    setTags,
    toggleSaveMentor,
    isSaved,
    startSession,
    endSession,
    recordCheckIn,
    checkInsThisWeek,
    claimMentorInvite,
    submitSaathiApplication,
    setMentorOnline,
    updateMentorProfile,
    simulateEarning,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export type { ChatMessage };
