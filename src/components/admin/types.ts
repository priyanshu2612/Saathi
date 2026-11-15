export interface Counted { label: string; count: number }

export interface DailyRow {
  d: string;
  new_seekers: number;
  active_seekers: number;
  active_saathi: number;
  sessions: number;
  talk_minutes: number;
  unanswered: number;
  revenue: number;
  purchases: number;
}

export interface SaathiRow {
  id: string;
  name: string;
  is_online: boolean;
  rating: number | null;
  requests: number;
  sessions: number;
  missed: number;
  talk_minutes: number;
  online_seconds: number;
  online_today: number;
  last_online: string | null;
  earned_coins: number;
  wallet: number;
}

export interface AdminStats {
  generated_at: string;
  today: string;
  range_days: number;
  range_from: string;
  live: { in_call: number; ringing: number; saathi_online: number };
  users: {
    total: number; new_today: number; new_yesterday: number; new_range: number;
    active_today: number; active_range: number; dau: number; wau: number; mau: number;
    avg_age: number | null;
  };
  engagement: {
    requested_ever: number; talked_ever: number; never_talked: number; one_time: number;
    repeat: number; power: number; avg_sessions_per_talker: number | null;
    avg_minutes_per_talker: number | null; buckets: Counted[];
  };
  funnel: Counted[];
  talk: {
    minutes_today: number; minutes_range: number; minutes_all: number;
    sessions_today: number; sessions_range: number; sessions_all: number;
    requests_range: number; avg_seconds: number | null; median_seconds: number | null;
    longest_seconds: number | null; connect_rate: number | null;
  };
  by_mode: { mode: string; sessions: number; minutes: number; avg_seconds: number; coins: number }[];
  outcomes: { status: string; count: number }[];
  topics: { topic: string; count: number }[];
  durations: Counted[];
  hours: { h: number; requests: number; connected: number }[];
  money: {
    revenue_today: number; revenue_yesterday: number; revenue_range: number; revenue_all: number;
    purchases_today: number; purchases_range: number; purchases_all: number;
    payers_all: number; payers_range: number; repeat_payers: number;
    avg_order: number | null; arppu: number | null; conversion_pct: number | null;
    by_pack: { price: number; count: number; revenue: number }[];
    coins_spent_calls: number; coins_spent_gifts: number; coins_to_saathi: number; coins_bonus: number;
    wallet_seekers: number; wallet_saathi: number;
    gifts_count: number; gifts_coins: number;
    top_gifts: { name: string; count: number; coins: number }[];
  };
  saathi: {
    approved: number; pending: number; rejected: number; online_now: number;
    active_today: number; active_range: number;
    online_hours_today: number; online_hours_range: number;
    avg_rating: number | null; rating_count: number;
    rating_dist: { stars: number; count: number }[];
    table: SaathiRow[];
    applications: { total: number; today: number; range: number; pending: number; shortlisted: number; rejected: number };
    apply_funnel: { step: number; label: string; visitors: number; pct_of_start: number | null; lost_from_previous: number | null }[];
  };
  daily: DailyRow[];
  cohorts: { week: string; joined: number; talked: number; repeated: number; paid: number }[];
  top_spenders: { username: string | null; phone_tail: string; inr: number; buys: number; talks: number; minutes: number }[];
  recent_purchases: { username: string | null; inr: number; coins: number; at: string }[];
  recent_signups: { username: string | null; age: number | null; at: string; talks: number }[];
  recent_sessions: { seeker: string | null; saathi: string | null; mode: string; status: string; seconds: number; coins: number; at: string }[];
  reports: { open: number; reviewing: number; range: number; latest: { reason: string; status: string; at: string }[] };
}

export interface UserPerson {
  id: string; code: string; username: string | null; display_name: string | null;
  phone: string | null; age: number | null; joined: string; last_active: string | null;
  requests: number; sessions: number; talk_seconds: number; purchases: number; spent_inr: number;
  gifts_sent: number; gift_coins: number; balance: number; locked: boolean;
}

export interface SaathiPerson {
  id: string; code: string; login_code: string | null; name: string; phone: string | null;
  whatsapp: string | null; status: string; is_online: boolean; rating: number | null;
  session_count: number; joined: string; last_active: string | null;
  online_seconds: number; online_days: number; sessions: number; talk_seconds: number;
  earned_coins: number; wallet: number; bio: string | null; tagline: string | null;
  tags: string[] | null; languages: string[] | null;
  rate_chat: number | null; rate_audio: number | null; rate_video: number | null;
  age: number | null; gender: string | null; nationality: string | null; born_city: string | null;
  qualification: string | null; college: string | null; school: string | null; religion: string | null;
  communication_tags: string[] | null; personality_tags: string[] | null;
  application_id: string | null; photos: string[]; application_photos: string[];
}

export interface ApplicantPerson {
  id: string; code: string; name: string; age: number | null; city: string | null;
  phone: string | null; whatsapp: string | null; languages: string[] | null; languages_other: string | null;
  profession: string | null; topics: string[] | null; modes: string[] | null;
  hours_per_week: string | null; availability_times: string[] | null; quiet_space: string | null;
  heard_about: string | null; status: string; joined: string;
  saathi_id: string | null; login_code: string | null; invite_status: string | null;
  photos: string[];
}

export interface PeopleData {
  users: UserPerson[]; saathi: SaathiPerson[]; applicants: ApplicantPerson[]; generated_at: string;
}
