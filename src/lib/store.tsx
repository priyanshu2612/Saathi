"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MOCK_MENTORS, FREE_TRIAL_COINS, firstRechargeBonus } from "./mock-data";
import { Gift, saathiGiftCoins } from "./gifts";
import { openRazorpayCheckout } from "./razorpay";
import {
  ChatMessage,
  CoinPack,
  ReceivedGift,
  CoinTransaction,
  Mentor,
  MoodTag,
  SessionMode,
  SessionRecord,
  TopicCategory,
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
  seekerLogIn,
  seekerLookup,
  seekerSignUp,
  createPaymentOrder,
  sendGift as sendGiftRemote,
  sessionTick,
  setSeekerId,
  setMentorOnlineRemote,
  setSessionTopic as setSessionTopicRemote,
  startSessionRemote,
  submitSaathiApplication as submitSaathiApplicationRemote,
  updateMentorProfileRemote,
} from "./data/backend";

const STORAGE_KEY = "comfort-companion-demo-state-v1";
const DEMO_ACCOUNTS_KEY = "comfort-companion-demo-accounts-v1";

export const PIN_LENGTH = 4;

export type AuthResult = { ok: true } | { ok: false; error: string };

// Demo mode has no backend, so accounts live in localStorage. Plaintext PIN
// is fine here — it's a throwaway local mock, never the real-mode path.
function readDemoAccounts(): Record<string, { pin: string; username: string }> {
  try {
    return JSON.parse(window.localStorage.getItem(DEMO_ACCOUNTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

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
  username: string;
  age: number | null;
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
  mentorGifts: ReceivedGift[];
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
  username: "",
  age: null,
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
  mentorGifts: [],
};

interface AppState extends PersistedState {
  hydrated: boolean;
  mentors: Mentor[];
  /** True once the phone number step has told us whether to create or enter a PIN. */
  authIntent: "login" | "signup" | null;
  checkPhone: (phone: string) => Promise<{ ok: true; exists: boolean } | { ok: false; error: string }>;
  signUp: (pin: string) => Promise<AuthResult>;
  logIn: (pin: string) => Promise<AuthResult>;
  logOut: () => void;
  activateSession: (sessionId: string) => void;
  dropSession: (sessionId: string) => void;
  setSessionTopic: (sessionId: string, category: TopicCategory, topic: string) => Promise<void>;
  setHomeFilter: (filter: HomeFilter) => void;
  addCoins: (amount: number, type: CoinTransaction["type"], description?: string) => void;
  /** Credits a purchased pack, plus the one-time first-recharge bonus. Returns the bonus granted. */
  rechargeCoins: (packCoins: number) => number;
  sendGift: (
    sessionId: string,
    mentor: { id: string; name: string },
    gift: Gift
  ) => Promise<{ ok: boolean; error?: string }>;
  recordGiftReceived: (gift: ReceivedGift) => void;
  /** Buys a coin pack. Real mode goes through Razorpay; demo mode just credits the coins. */
  purchasePack: (pack: CoinPack) => Promise<{ ok: boolean; error?: string }>;
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
    const loaded = loadState();
    // Sessions from before PIN accounts existed were "signed in" by the old
    // mock OTP and have no username — send them through sign-up instead.
    setState(loaded.isAuthenticated && !loaded.username ? { ...loaded, isAuthenticated: false } : loaded);
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

  // Seeker accounts (phone + PIN) are created/verified by the seeker_auth
  // edge function, which hands back the user id. Once signed in, hydrate
  // coinBalance/transactions/sessions from the server, which is the source
  // of truth in real mode.
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

  const [authIntent, setAuthIntent] = useState<"login" | "signup" | null>(null);

  const applyAccount = useCallback(
    (account: { phone: string; username: string; age: number | null }) => {
      setState((prev) => ({
        ...prev,
        isAuthenticated: true,
        phoneNumber: account.phone,
        username: account.username,
        age: account.age,
      }));
    },
    []
  );

  const checkPhone = useCallback(async (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) return { ok: false as const, error: "Enter a valid 10-digit phone number." };
    try {
      const exists = isDemoMode
        ? Boolean(readDemoAccounts()[digits])
        : await seekerLookup(digits);
      setState((prev) => ({ ...prev, phoneNumber: digits }));
      setAuthIntent(exists ? "login" : "signup");
      return { ok: true as const, exists };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Couldn't reach the server. Try again.",
      };
    }
  }, []);

  const signUp = useCallback(
    async (pin: string): Promise<AuthResult> => {
      const phone = state.phoneNumber;
      if (phone.length !== 10 || pin.length !== PIN_LENGTH) {
        return { ok: false, error: "Enter your phone number and a 4-digit PIN." };
      }
      try {
        if (isDemoMode) {
          const accounts = readDemoAccounts();
          if (accounts[phone]) return { ok: false, error: "An account with this number already exists." };
          const username = `Seeker${Math.floor(1000 + Math.random() * 9000)}`;
          accounts[phone] = { pin, username };
          window.localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
          applyAccount({ phone, username, age: null });
        } else {
          const account = await seekerSignUp(phone, pin);
          setSeekerId(account.userId);
          applyAccount(account);
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Could not create your account." };
      }
    },
    [state.phoneNumber, applyAccount]
  );

  const logIn = useCallback(
    async (pin: string): Promise<AuthResult> => {
      const phone = state.phoneNumber;
      if (phone.length !== 10 || pin.length !== PIN_LENGTH) {
        return { ok: false, error: "Enter your 4-digit PIN." };
      }
      try {
        if (isDemoMode) {
          const account = readDemoAccounts()[phone];
          if (!account || account.pin !== pin) return { ok: false, error: "Wrong PIN. Try again." };
          applyAccount({ phone, username: account.username, age: null });
        } else {
          const account = await seekerLogIn(phone, pin);
          setSeekerId(account.userId);
          applyAccount(account);
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Could not sign you in." };
      }
    },
    [state.phoneNumber, applyAccount]
  );

  const logOut = useCallback(() => {
    if (!isDemoMode) setSeekerId(null);
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      username: "",
      age: null,
    }));
  }, []);

  const activateSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: "active", startedAt: new Date().toISOString() } : s
      ),
    }));
  }, []);

  const dropSession = useCallback((sessionId: string) => {
    setState((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== sessionId) }));
  }, []);

  const setSessionTopic = useCallback(
    async (sessionId: string, category: TopicCategory, topic: string) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId ? { ...s, topicCategory: category, topic } : s
        ),
      }));
      if (!isDemoMode) {
        const seekerId = getSeekerId();
        if (seekerId) await setSessionTopicRemote(seekerId, sessionId, category, topic);
      }
    },
    []
  );

  const setHomeFilter = useCallback((filter: HomeFilter) => {
    setState((prev) => ({ ...prev, homeFilter: filter }));
  }, []);

  const addCoins = useCallback(
    (amount: number, type: CoinTransaction["type"], description?: string) => {
      setState((prev) => ({
        ...prev,
        coinBalance: prev.coinBalance + amount,
        transactions: [
          { id: `tx-${Date.now()}-${type}`, amount, type, description, createdAt: new Date().toISOString() },
          ...prev.transactions,
        ],
      }));
    },
    []
  );

  const rechargeCoins = useCallback((packCoins: number) => {
    const isFirst = !state.transactions.some((tx) => tx.type === "purchase");
    const bonus = isFirst ? firstRechargeBonus(packCoins) : 0;
    addCoins(packCoins, "purchase");
    if (bonus > 0) addCoins(bonus, "bonus", "First-recharge bonus");
    return bonus;
  }, [state.transactions, addCoins]);

  const purchasePack = useCallback(
    async (pack: CoinPack) => {
      if (isDemoMode) {
        rechargeCoins(pack.coins);
        return { ok: true };
      }
      try {
        const seekerId = getSeekerId();
        if (!seekerId) return { ok: false, error: "Sign in again to add coins." };
        const before = state.coinBalance;
        const order = await createPaymentOrder(seekerId, pack.id);
        await openRazorpayCheckout({
          ...order,
          description: `${pack.coins} coins`,
          contact: state.phoneNumber || undefined,
        });
        // The webhook credits the coins a moment after the payment clears.
        for (let attempt = 0; attempt < 10; attempt++) {
          const account = await getAccount(seekerId);
          if (account.coinBalance > before || attempt === 9) {
            setState((prev) => ({
              ...prev,
              coinBalance: account.coinBalance,
              transactions: account.transactions,
              sessions: account.sessions,
            }));
            return account.coinBalance > before
              ? { ok: true }
              : { ok: true, error: "Payment received — your coins will appear shortly." };
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Payment failed." };
      }
    },
    [rechargeCoins, state.coinBalance, state.phoneNumber]
  );

  const sendGift = useCallback(
    async (sessionId: string, mentor: { id: string; name: string }, gift: Gift) => {
      const description = `${gift.name} to ${mentor.name}`;
      if (!isDemoMode) {
        try {
          const seekerId = getSeekerId();
          if (!seekerId) return { ok: false, error: "Sign in again to send gifts." };
          const result = await sendGiftRemote(seekerId, sessionId, gift.id);
          setState((prev) => ({
            ...prev,
            coinBalance: result.coinBalance,
            transactions: [
              {
                id: `tx-${Date.now()}-gift`,
                amount: -gift.coins,
                type: "gift_sent",
                description,
                createdAt: new Date().toISOString(),
                relatedSessionId: sessionId,
              },
              ...prev.transactions,
            ],
          }));
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "Couldn't send the gift." };
        }
      }
      if (state.coinBalance < gift.coins) return { ok: false, error: "Not enough coins." };
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        coinBalance: prev.coinBalance - gift.coins,
        transactions: [
          {
            id: `tx-${Date.now()}-gift`,
            amount: -gift.coins,
            type: "gift_sent",
            description,
            createdAt: now,
            relatedSessionId: sessionId,
          },
          ...prev.transactions,
        ],
        // Demo mode has no separate Saathi device, so credit them here.
        mentorEarnings: prev.mentorEarnings + saathiGiftCoins(gift.coins),
        mentorGifts: [
          {
            id: `gift-${Date.now()}`,
            giftId: gift.id,
            giftName: gift.name,
            coins: saathiGiftCoins(gift.coins),
            from: prev.username || "A seeker",
            createdAt: now,
          },
          ...prev.mentorGifts,
        ],
      }));
      return { ok: true };
    },
    [state.coinBalance]
  );

  const recordGiftReceived = useCallback((gift: ReceivedGift) => {
    setState((prev) =>
      prev.mentorGifts.some((g) => g.id === gift.id)
        ? prev
        : {
            ...prev,
            mentorEarnings: prev.mentorEarnings + gift.coins,
            mentorGifts: [gift, ...prev.mentorGifts],
          }
    );
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
        status: mode === "video" ? "ringing" : "active",
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
    authIntent,
    checkPhone,
    signUp,
    logIn,
    logOut,
    activateSession,
    dropSession,
    setSessionTopic,
    setHomeFilter,
    addCoins,
    rechargeCoins,
    purchasePack,
    sendGift,
    recordGiftReceived,
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
