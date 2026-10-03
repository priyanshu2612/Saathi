import { CoinPack, InboundSessionRecord, Mentor } from "./types";

// A couple of short, freely-licensed sample clips (MDN's cc0-videos set)
// standing in for mentor intro videos until real uploads exist.
const SAMPLE_VIDEOS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
];

function gallery(baseUrl: string, count: number): string[] {
  // Same source photo, different crop focal points — stands in for a real
  // multi-photo gallery until mentors upload their own sets.
  const crops = ["faces", "top", "entropy", "center", "edges"];
  return Array.from({ length: count }, (_, i) =>
    i === 0 ? baseUrl : `${baseUrl}&crop=${crops[i % crops.length]}&sat=-${i * 4}`
  );
}

export const MOCK_MENTORS: Mentor[] = [
  {
    id: "m1",
    name: "Ananya",
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    photos: gallery(
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
      4
    ),
    videos: SAMPLE_VIDEOS,
    tagline: "Kaam ka stress hai na? Chal, mujhse baat kar, halka lagega",
    tags: ["stress", "work"],
    languages: ["English", "Hindi"],
    bio: "I've spent the last few years listening — really listening — to people going through exactly what you might be going through. Work stress especially: I know how it creeps into everything else. I trained in active listening and check in with a supervisor every month so I stay sharp for the people who need me.",
    rateChat: 0,
    rateAudio: 24,
    rateVideo: 48,
    rating: 4.9,
    sessionCount: 812,
    isOnline: true,
    tier: "top_rated",
    popular: true,
    responseRatePct: 97,
    boundaries: ["Won't discuss self-harm — will refer to a crisis line"],
    age: 26,
    gender: "Female",
    nationality: "Indian",
    bornCity: "Pune",
    qualification: "MSc Clinical Psychology",
    college: "Fergusson College, Pune",
    school: "Symbiosis International School",
    religion: "Hindu",
    communicationTags: ["Calm", "Supportive", "Non-judgmental", "Active Listener", "Warm"],
    personalityTags: ["Empathetic", "Patient", "Grounded", "Caring"],
  },
  {
    id: "m2",
    name: "Priya",
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
    photos: gallery(
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
      4
    ),
    videos: [SAMPLE_VIDEOS[0]],
    tagline: "Akela mehsoos ho raha hai? Main hoon na, baat karo mujhse",
    tags: ["loneliness", "just_talk", "friend"],
    languages: ["English", "Hindi", "Marathi"],
    bio: "Some nights just feel long. I'm here for the quiet ones — no pressure to explain everything, just someone to talk to until it feels a little lighter. I studied psychology and spend most evenings just talking with people who need a friendly ear.",
    rateChat: 0,
    rateAudio: 14,
    rateVideo: 26,
    rating: 4.7,
    sessionCount: 430,
    isOnline: true,
    tier: "standard",
    rising: true,
    responseRatePct: 92,
    age: 24,
    gender: "Female",
    nationality: "Indian",
    bornCity: "Srinagar",
    qualification: "MSc Clinical Psychology",
    college: "Jain University, Bengaluru",
    school: "Green Valley",
    religion: "Muslim",
    communicationTags: ["Calm", "Supportive", "Non-judgmental", "Active Listener", "Warm", "Friendly", "Easy to Talk To", "Cooperative", "Gentle"],
    personalityTags: ["Empathetic", "Friendly", "Patient", "Open-minded", "Caring"],
  },
  {
    id: "m3",
    name: "Kabir",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    photos: gallery(
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
      3
    ),
    videos: [],
    tagline: "Breakup ke baad sab ajeeb lagta hai na? Chal, baat karte hain",
    tags: ["breakup", "loneliness"],
    languages: ["English"],
    bio: "Breakups don't follow a schedule for when you're supposed to feel okay again. I won't rush you through it — we can just talk about what's actually going on.",
    rateChat: 0,
    rateAudio: 18,
    rateVideo: 32,
    rating: 4.8,
    sessionCount: 601,
    isOnline: false,
    tier: "standard",
    responseRatePct: 89,
    age: 28,
    gender: "Male",
    nationality: "Indian",
    bornCity: "Lucknow",
    qualification: "BA Psychology",
    college: "Delhi University",
    school: "St. Xavier's",
    religion: "Sikh",
    communicationTags: ["Calm", "Supportive", "Easy to Talk To", "Gentle"],
    personalityTags: ["Patient", "Grounded", "Friendly"],
  },
  {
    id: "m4",
    name: "Meera",
    photoUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
    photos: gallery(
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
      4
    ),
    videos: SAMPLE_VIDEOS,
    tagline: "Din bhar ki bakwas nikaalni hai? Bina judge kiye sunungi",
    tags: ["work", "stress", "just_talk", "fun"],
    languages: ["English", "Hindi"],
    bio: "Trained in active listening, and I mean actually trained — not just a title. If you need to vent about your day without being told to 'just relax,' I'm your person.",
    rateChat: 0,
    rateAudio: 28,
    rateVideo: 55,
    rating: 5.0,
    sessionCount: 1023,
    isOnline: true,
    tier: "top_rated",
    popular: true,
    responseRatePct: 99,
    age: 29,
    gender: "Female",
    nationality: "Indian",
    bornCity: "Chennai",
    qualification: "MA Counselling Psychology",
    college: "Loyola College, Chennai",
    school: "Church Park Convent",
    religion: "Christian",
    communicationTags: ["Calm", "Supportive", "Non-judgmental", "Active Listener", "Warm", "Friendly"],
    personalityTags: ["Empathetic", "Friendly", "Patient", "Caring"],
  },
  {
    id: "m5",
    name: "Riya",
    photoUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
    photos: gallery(
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop",
      4
    ),
    videos: [SAMPLE_VIDEOS[1]],
    tagline: "Jo bhi dil mein hai, bol do — judge nahi karungi",
    tags: ["loneliness", "breakup", "just_talk", "flirt", "fun"],
    languages: ["English", "Gujarati"],
    bio: "I like to think of these conversations as a soft place to land. Whatever brought you here today, you don't need to have it figured out before we talk.",
    rateChat: 0,
    rateAudio: 16,
    rateVideo: 28,
    rating: 4.6,
    sessionCount: 275,
    isOnline: true,
    tier: "standard",
    rising: true,
    responseRatePct: 90,
    age: 23,
    gender: "Female",
    nationality: "Indian",
    bornCity: "Ahmedabad",
    qualification: "BSc Psychology",
    college: "Gujarat University",
    school: "Anand Niketan",
    religion: "Hindu",
    communicationTags: ["Warm", "Friendly", "Easy to Talk To", "Gentle"],
    personalityTags: ["Empathetic", "Open-minded", "Caring"],
  },
  {
    id: "m6",
    name: "Devika",
    photoUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop",
    photos: gallery(
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=800&auto=format&fit=crop",
      3
    ),
    videos: [],
    tagline: "Sukoon se baat karni hai? Main yahin hoon, bolo",
    tags: ["stress", "loneliness", "friend"],
    languages: ["English", "Hindi", "Bengali"],
    bio: "Calm, unhurried conversations — that's what I try to offer. No judgment, no performance, just a real exchange between two people.",
    rateChat: 0,
    rateAudio: 20,
    rateVideo: 36,
    rating: 4.85,
    sessionCount: 540,
    isOnline: false,
    tier: "standard",
    responseRatePct: 94,
    age: 27,
    gender: "Female",
    nationality: "Indian",
    bornCity: "Kolkata",
    qualification: "MSc Applied Psychology",
    college: "Presidency University",
    school: "La Martiniere for Girls",
    religion: "Hindu",
    communicationTags: ["Calm", "Non-judgmental", "Gentle", "Cooperative"],
    personalityTags: ["Grounded", "Patient", "Caring"],
  },
];

export const COIN_PACKS: CoinPack[] = [
  { id: "p1", name: "A Little Time", priceInr: 249, coins: 250, bonusLabel: "Enough for a quick check-in", frame: "starter" },
  { id: "p2", name: "A Good Talk", priceInr: 499, coins: 550, bonusLabel: "Our most-loved pack", frame: "popular" },
  { id: "p3", name: "Real Connection", priceInr: 999, coins: 1150, bonusLabel: "For when you need more than a moment", frame: "value" },
  { id: "p4", name: "Always Here", priceInr: 2499, coins: 3000, bonusLabel: "Peace of mind, whenever you need it", frame: "power" },
];

export const FREE_TRIAL_COINS = 60;

// One-time bonus on a seeker's very first recharge, as a % of the pack's coins.
export const FIRST_RECHARGE_BONUS_PCT = 50;

export const firstRechargeBonus = (packCoins: number) =>
  Math.round((packCoins * FIRST_RECHARGE_BONUS_PCT) / 100);

// Extra coins a pack gives over the entry pack's coins-per-rupee rate.
export const packExtraCoins = (pack: CoinPack) =>
  Math.max(0, pack.coins - Math.round(pack.priceInr * (COIN_PACKS[0].coins / COIN_PACKS[0].priceInr)));

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

// Seekers who have reached out to this mentor — powers the mentor-side
// "Seekers" history tab. Static demo data; a real backend would scope this
// to the logged-in mentor's own inbound sessions.
export const MOCK_INBOUND_SESSIONS: InboundSessionRecord[] = [
  {
    id: "in-1",
    seekerName: "Rahul M.",
    seekerPhotoUrl:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=400&auto=format&fit=crop",
    mode: "video",
    startedAt: hoursAgo(2),
    durationMin: 14,
    coinsEarned: 91,
  },
  {
    id: "in-2",
    seekerName: "Sneha K.",
    seekerPhotoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
    mode: "chat",
    startedAt: hoursAgo(6),
    durationMin: 22,
    coinsEarned: 110,
  },
  {
    id: "in-3",
    seekerName: "Arjun P.",
    seekerPhotoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    mode: "audio",
    startedAt: hoursAgo(20),
    durationMin: 8,
    coinsEarned: 52,
  },
  {
    id: "in-4",
    seekerName: "Neha S.",
    seekerPhotoUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop",
    mode: "chat",
    startedAt: hoursAgo(30),
    durationMin: 5,
    coinsEarned: 25,
  },
  {
    id: "in-5",
    seekerName: "Vikram T.",
    seekerPhotoUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop",
    mode: "video",
    startedAt: hoursAgo(50),
    durationMin: 19,
    coinsEarned: 124,
  },
];
