"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CaretLeft, Plus, X, CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Chip from "@/components/ui/Chip";
import { useAppState } from "@/lib/store";
import type { SaathiApplicationDraft } from "@/lib/data/backend";

const LANGUAGES = [
  "English", "Hindi", "Hinglish", "Marathi", "Gujarati", "Punjabi",
  "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam",
];
const TOPICS = [
  "Casual & social", "Dating & relationships", "College life",
  "Work & career", "Life & emotions", "Difficult conversations",
];
const MODES = ["Chat", "Audio call", "Video call"];
const HOURS = ["5 to 10", "10 to 20", "20 to 30", "30+"];
const TIMES = ["Morning", "Afternoon", "Evening", "Late night"];
const QUIET_SPACE = ["Yes, always", "Mostly", "Not yet"];
const HEARD_ABOUT = ["Instagram or Facebook ad", "A friend or colleague"];

type Draft = SaathiApplicationDraft;

const EMPTY_DRAFT: Draft = {
  fullName: "",
  age: 0,
  cityState: "",
  phone: "",
  whatsappNumber: "",
  languages: [],
  languagesOther: "",
  profession: "",
  topics: [],
  modes: [],
  hoursPerWeek: "",
  availabilityTimes: [],
  quietSpace: "",
  heardAbout: "",
  photos: [],
  confirmedAgeAndTrue: false,
  confirmedIdCheck: false,
  confirmedConductReview: false,
  confirmedContactConsent: false,
};

const TOTAL_STEPS = 7;
const MIN_PHOTOS = 3;
const MAX_PHOTOS = 6;

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

async function resizeImageToDataUrl(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

const fieldClass =
  "w-full rounded-xl2 border border-linen-200 bg-linen-100 px-4 py-3.5 text-[15px] text-dusk-900 outline-none focus:border-warmth-500";

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-[13px] font-medium text-dusk-700">{children}</label>
      {hint && <p className="mt-0.5 text-[12px] text-dusk-400">{hint}</p>}
    </div>
  );
}

export default function SaathiApplyPage() {
  const router = useRouter();
  const { submitSaathiApplication } = useAppState();
  const [step, setStep] = useState(0); // 0 = intro, 1..7 = form, 8 = thank you
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [ageText, setAgeText] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const goNext = () => {
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS + 1));
  };
  const goBack = () => {
    setError(null);
    if (step === 0) {
      router.push("/saathi");
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const isValid = (() => {
    switch (step) {
      case 1:
        return (
          draft.fullName.trim().length > 1 &&
          Number(ageText) >= 18 &&
          draft.cityState.trim().length > 1
        );
      case 2:
        return draft.phone.length === 10 && (sameAsPhone || draft.whatsappNumber.length === 10);
      case 3:
        return draft.languages.length > 0 || draft.languagesOther.trim().length > 0;
      case 4:
        return draft.profession.trim().length > 0 && draft.topics.length > 0;
      case 5:
        return (
          draft.modes.length > 0 &&
          draft.hoursPerWeek.length > 0 &&
          draft.availabilityTimes.length > 0 &&
          draft.quietSpace.length > 0
        );
      case 6:
        return draft.photos.length >= MIN_PHOTOS;
      case 7:
        return (
          draft.confirmedAgeAndTrue &&
          draft.confirmedIdCheck &&
          draft.confirmedConductReview &&
          draft.confirmedContactConsent
        );
      default:
        return true;
    }
  })();

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      set("photos", [...draft.photos, dataUrl].slice(0, MAX_PHOTOS));
    } catch {
      setError("Couldn't read that photo — try a different one.");
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    const result = await submitSaathiApplication({
      ...draft,
      whatsappNumber: sameAsPhone ? draft.phone : draft.whatsappNumber,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong — please try again.");
      return;
    }
    setStep(TOTAL_STEPS + 1);
  };

  // ---------------------------------------------------------------- intro
  if (step === 0) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden pb-6">
        {/* flex-1 + min-h-0 lets this shrink on short screens instead of the
            page scrolling — object-top means any cropping eats into the
            bottom of the photo first, never the headline/badges up top. */}
        <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-b-xl2">
          <Image
            src="/saathi/be-a-saathi-hero.webp"
            alt="Be a Saathi — earn up to ₹10,000 per day, up to 90% commission, verified and safe"
            fill
            priority
            className="object-cover object-top"
          />
        </div>

        <div className="flex shrink-0 flex-col px-6 pt-4">
          <div className="rounded-xl2 bg-sage-50 p-4">
            <p className="text-[13px] text-dusk-700">
              <span className="font-semibold">How it works:</span> fill this in ~5 minutes → we
              review every application personally → if shortlisted, you get a personal access code
              → use it to go live.
            </p>
          </div>

          <div className="pt-4">
            <PrimaryButton onClick={() => setStep(1)}>Let&apos;s begin</PrimaryButton>
            <p className="mt-2 text-center text-[12px] text-dusk-400">
              Takes 5 minutes. Joining is always free.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ thank you
  if (step === TOTAL_STEPS + 1) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-50">
          <CheckCircle size={34} weight="fill" className="text-sage-500" />
        </div>
        <h1 className="mt-6 font-display text-[24px] text-dusk-900">Thank you!</h1>
        <p className="mt-2 max-w-xs text-[14px] text-dusk-400">
          Your responses are stored and we&apos;re reviewing every application personally. If you&apos;re
          shortlisted, we&apos;ll send your personal access code on WhatsApp.
        </p>
        <p className="mt-3 max-w-xs text-[12.5px] text-dusk-400">
          Joining is always free — we&apos;ll never ask you for money.
        </p>
        <div className="mt-10 w-full max-w-xs">
          <PrimaryButton onClick={() => router.push("/welcome")}>Done</PrimaryButton>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------- form steps
  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-linen-100 text-dusk-900"
          >
            <CaretLeft size={18} />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-linen-200">
            <div
              className="h-full rounded-full bg-warmth-500 transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-4 pt-6">
        {step === 1 && (
          <div>
            <h2 className="font-display text-[22px] text-dusk-900">About you</h2>
            <p className="mt-1 text-[13px] text-dusk-400">Just the basics, for now.</p>
            <div className="mt-6 space-y-4">
              <div>
                <Label>Full name</Label>
                <input
                  value={draft.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  className={fieldClass}
                  placeholder="As on your ID"
                />
              </div>
              <div>
                <Label>Age</Label>
                <input
                  value={ageText}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setAgeText(v);
                    set("age", Number(v) || 0);
                  }}
                  inputMode="numeric"
                  className={fieldClass}
                  placeholder="You must be 18 or older"
                />
              </div>
              <div>
                <Label>City &amp; state</Label>
                <input
                  value={draft.cityState}
                  onChange={(e) => set("cityState", e.target.value)}
                  className={fieldClass}
                  placeholder="e.g. Pune, Maharashtra"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-[22px] text-dusk-900">How can we reach you</h2>
            <p className="mt-1 text-[13px] text-dusk-400">
              We&apos;ll only use this to send your access code and stay in touch about your
              application.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <Label>Phone number</Label>
                <div className="flex items-center overflow-hidden rounded-xl2 border border-linen-200 bg-linen-100 focus-within:border-warmth-500">
                  <span className="border-r border-linen-200 px-4 py-3.5 text-[15px] text-dusk-700">+91</span>
                  <input
                    value={draft.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder="98765 43210"
                    className="flex-1 bg-transparent px-4 py-3.5 text-[15px] text-dusk-900 outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-[13.5px] text-dusk-700">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="h-4.5 w-4.5 accent-warmth-500"
                />
                My WhatsApp number is the same
              </label>

              {!sameAsPhone && (
                <div>
                  <Label>WhatsApp number</Label>
                  <div className="flex items-center overflow-hidden rounded-xl2 border border-linen-200 bg-linen-100 focus-within:border-warmth-500">
                    <span className="border-r border-linen-200 px-4 py-3.5 text-[15px] text-dusk-700">+91</span>
                    <input
                      value={draft.whatsappNumber}
                      onChange={(e) => set("whatsappNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      inputMode="numeric"
                      placeholder="98765 43210"
                      className="flex-1 bg-transparent px-4 py-3.5 text-[15px] text-dusk-900 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-[22px] text-dusk-900">Languages</h2>
            <p className="mt-1 text-[13px] text-dusk-400">
              What are you comfortable speaking with Seekers?
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <Chip
                  key={lang}
                  label={lang}
                  selected={draft.languages.includes(lang)}
                  onClick={() => set("languages", toggleIn(draft.languages, lang))}
                />
              ))}
            </div>
            <div className="mt-4">
              <Label>Other language (optional)</Label>
              <input
                value={draft.languagesOther}
                onChange={(e) => set("languagesOther", e.target.value)}
                className={fieldClass}
                placeholder="Type another language"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-display text-[22px] text-dusk-900">About you</h2>
            <div>
              <Label>Profession</Label>
              <input
                value={draft.profession}
                onChange={(e) => set("profession", e.target.value)}
                className={fieldClass}
                placeholder="e.g. Student, Software Engineer, Teacher"
              />
            </div>
            <div className="mt-6">
              <p className="text-[14px] font-medium text-dusk-700">What would you like to talk about?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <Chip key={t} label={t} selected={draft.topics.includes(t)} onClick={() => set("topics", toggleIn(draft.topics, t))} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-display text-[22px] text-dusk-900">Your availability</h2>
            <div>
              <p className="text-[14px] font-medium text-dusk-700">Ways you&apos;re comfortable talking</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <Chip key={m} label={m} selected={draft.modes.includes(m)} onClick={() => set("modes", toggleIn(draft.modes, m))} />
                ))}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[14px] font-medium text-dusk-700">Hours a week you could be available</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HOURS.map((h) => (
                  <Chip key={h} label={h} selected={draft.hoursPerWeek === h} onClick={() => set("hoursPerWeek", h)} />
                ))}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[14px] font-medium text-dusk-700">When are you usually free</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TIMES.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={draft.availabilityTimes.includes(t)}
                    onClick={() => set("availabilityTimes", toggleIn(draft.availabilityTimes, t))}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[14px] font-medium text-dusk-700">A private, quiet space and stable internet?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUIET_SPACE.map((q) => (
                  <Chip key={q} label={q} selected={draft.quietSpace === q} onClick={() => set("quietSpace", q)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="font-display text-[22px] text-dusk-900">Add your photos</h2>
            <p className="mt-1 text-[13px] text-dusk-400">
              Add at least {MIN_PHOTOS} clear, friendly photos of yourself — up to {MAX_PHOTOS}.
              Seekers feel more comfortable reaching out when they can see who they&apos;re
              talking to.
            </p>

            <div className="mt-4 flex gap-3 rounded-xl2 bg-sage-50 p-3.5">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-sage-500" weight="fill" />
              <p className="text-[12.5px] text-dusk-700">
                Your photos are kept private and used only by our review team to verify it&apos;s
                really you — they&apos;re never shown publicly until you&apos;re approved and go
                live.
              </p>
            </div>

            <p className="mt-4 text-[12.5px] font-medium text-dusk-700">
              {draft.photos.length} of {MIN_PHOTOS} minimum added
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {draft.photos.map((url, i) => (
                <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set("photos", draft.photos.filter((_, idx) => idx !== i))}
                    aria-label="Remove photo"
                    className="tap-target absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={13} weight="bold" />
                  </button>
                </div>
              ))}
              {draft.photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="tap-target flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl2 border-2 border-dashed border-linen-200 text-dusk-400"
                >
                  <Plus size={20} />
                  <span className="text-[11px]">Add photo</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoPick}
              className="hidden"
            />
          </div>
        )}

        {step === 7 && (
          <div>
            <h2 className="font-display text-[22px] text-dusk-900">Before you submit</h2>
            <p className="mt-1 text-[13px] text-dusk-400">
              We review every application personally — joining is always free.
            </p>

            <div className="mt-5">
              <label className="flex items-start gap-3 rounded-xl2 bg-linen-100 p-3.5">
                <input
                  type="checkbox"
                  checked={draft.confirmedAgeAndTrue}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDraft((d) => ({
                      ...d,
                      confirmedAgeAndTrue: checked,
                      confirmedIdCheck: checked,
                      confirmedConductReview: checked,
                      confirmedContactConsent: checked,
                    }));
                  }}
                  className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-warmth-500"
                />
                <span className="text-[13px] text-dusk-800">
                  I&apos;m 18 or older and everything I&apos;ve shared is true. I agree to an
                  identity check (ID and a short video) before going live, understand sessions may
                  be reviewed for safety, and agree to follow the conduct policy and be contacted
                  about my application on WhatsApp.
                </span>
              </label>
            </div>

            <div className="mt-6">
              <p className="text-[13px] font-medium text-dusk-700">How did you hear about us? (optional)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HEARD_ABOUT.map((h) => (
                  <Chip key={h} label={h} selected={draft.heardAbout === h} onClick={() => set("heardAbout", draft.heardAbout === h ? "" : h)} />
                ))}
              </div>
            </div>

            {error && <p className="mt-4 text-[13px] text-warmth-600">{error}</p>}
          </div>
        )}
      </div>

      <div className="px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">
        {error && step !== 7 && <p className="mb-2 text-[13px] text-warmth-600">{error}</p>}
        <PrimaryButton
          onClick={step === TOTAL_STEPS ? handleSubmit : goNext}
          disabled={!isValid || submitting}
        >
          {step === TOTAL_STEPS ? (submitting ? "Submitting…" : "Submit application") : "Continue"}
        </PrimaryButton>
      </div>
    </div>
  );
}
