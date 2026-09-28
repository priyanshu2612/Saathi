"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import Chip from "@/components/ui/Chip";
import PrimaryButton from "@/components/ui/PrimaryButton";
import MentorBottomNav from "@/components/ui/MentorBottomNav";
import ScreenHeader from "@/components/ui/ScreenHeader";
import MediaGallery from "@/components/mentor/MediaGallery";
import { PersonalDetails, AboutSection } from "@/components/mentor/MentorDetails";
import { useAppState } from "@/lib/store";
import {
  COMMUNICATION_TAG_OPTIONS,
  Mentor,
  MOOD_TAGS,
  MoodTag,
  PERSONALITY_TAG_OPTIONS,
} from "@/lib/types";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-medium text-dusk-700">{children}</label>;
}

const inputClass =
  "w-full rounded-xl2 border border-linen-200 bg-linen-100 px-4 py-3 text-[14px] text-dusk-900 outline-none focus:border-warmth-500";

export default function MentorProfileEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";
  const { mentorProfile, mentorOnline, mentorSessionsHelped, updateMentorProfile } = useAppState();
  const [draft, setDraft] = useState(mentorProfile);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag: MoodTag) => {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag],
    }));
  };

  const toggleListValue = (key: "communicationTags" | "personalityTags", value: string) => {
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((t) => t !== value) : [...d[key], value],
    }));
  };

  const addPhoto = () => {
    const url = newPhotoUrl.trim();
    if (!url) return;
    setDraft((d) => ({
      ...d,
      photos: [...d.photos, url],
      photoUrl: d.photos.length === 0 ? url : d.photoUrl,
    }));
    setNewPhotoUrl("");
  };

  const removePhoto = (index: number) => {
    setDraft((d) => {
      const photos = d.photos.filter((_, i) => i !== index);
      return { ...d, photos, photoUrl: photos[0] ?? d.photoUrl };
    });
  };

  const handleSave = () => {
    updateMentorProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    if (isOnboarding) router.push("/partner/dashboard");
  };

  // Combines the editable draft with the read-only fields the seeker-facing
  // mentor page needs, so the preview below can reuse those exact components.
  const previewMentor: Mentor = {
    id: "self",
    name: draft.name || "Your name",
    photoUrl: draft.photos[0] ?? draft.photoUrl,
    photos: draft.photos.length > 0 ? draft.photos : [draft.photoUrl],
    videos: [],
    tagline: draft.tagline,
    tags: draft.tags,
    languages: draft.languages,
    bio: draft.bio,
    rateChat: draft.rateChat,
    rateAudio: draft.rateAudio,
    rateVideo: draft.rateVideo,
    rating: 5,
    sessionCount: mentorSessionsHelped,
    isOnline: mentorOnline,
    tier: "standard",
    responseRatePct: 95,
    age: draft.age,
    gender: draft.gender,
    nationality: draft.nationality,
    bornCity: draft.bornCity,
    qualification: draft.qualification,
    college: draft.college,
    school: draft.school,
    religion: draft.religion,
    communicationTags: draft.communicationTags,
    personalityTags: draft.personalityTags,
  };

  return (
    <div className="flex min-h-screen flex-col">
      {!isOnboarding && <ScreenHeader title="Edit profile" onBack={() => router.push("/partner/dashboard")} />}
      {isOnboarding && (
        <div className="px-6 pt-8">
          <h1 className="font-display text-[24px] text-dusk-900">Let&apos;s finish your profile</h1>
          <p className="mt-1 text-[13px] text-dusk-400">
            Tell people what makes you a great listener. You can always change this later.
          </p>
        </div>
      )}

      <div className="flex-1 pt-4">
        <div className="px-6">
          <p className="mb-2 text-[13px] font-medium text-dusk-700">
            Preview — this is what Seekers see
          </p>
        </div>
        <div className="mx-6 overflow-hidden rounded-xl3 border border-linen-200">
          <MediaGallery photos={previewMentor.photos} videos={[]} alt={previewMentor.name} />
          <div className="bg-linen-50 p-4">
            <span className="font-display text-[18px] text-dusk-900">{previewMentor.name}</span>
            {previewMentor.tagline && (
              <p className="mt-0.5 text-[13px] text-dusk-400">{previewMentor.tagline}</p>
            )}
            <div className="mt-4">
              <AboutSection
                mentor={{
                  ...previewMentor,
                  bio: draft.bio || "Write a short introduction so Seekers know what to expect.",
                }}
              />
            </div>
            <div className="mt-4">
              <PersonalDetails mentor={previewMentor} />
            </div>
          </div>
        </div>

        <div className="px-6">
          <div className="mt-6">
            <FieldLabel>Photos</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {draft.photos.map((url, i) => (
                <div key={`${url}-${i}`} className="relative h-16 w-16 overflow-hidden rounded-xl2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label="Remove photo"
                    className="tap-target absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={11} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Paste an image URL"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addPhoto}
                aria-label="Add photo"
                className="tap-target flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl2 bg-warmth-500 text-white"
              >
                <Plus size={18} weight="bold" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Your name</FieldLabel>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="mt-4">
            <FieldLabel>Tagline</FieldLabel>
            <input
              value={draft.tagline}
              onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
              placeholder="A short one-liner shown under your name"
              className={inputClass}
            />
          </div>

          <div className="mt-4">
            <FieldLabel>Tell people what makes you a great listener</FieldLabel>
            <textarea
              value={draft.bio}
              onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
              rows={4}
              placeholder="I've spent the last few years listening — really listening..."
              className={inputClass}
            />
          </div>

          <div className="mt-4">
            <FieldLabel>What can you help with</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map((tag) => (
                <Chip key={tag.id} label={tag.label} selected={draft.tags.includes(tag.id)} onClick={() => toggleTag(tag.id)} />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Communication style</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {COMMUNICATION_TAG_OPTIONS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={draft.communicationTags.includes(tag)}
                  onClick={() => toggleListValue("communicationTags", tag)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Personality</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_TAG_OPTIONS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={draft.personalityTags.includes(tag)}
                  onClick={() => toggleListValue("personalityTags", tag)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Languages (comma separated)</FieldLabel>
            <input
              value={draft.languages.join(", ")}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  languages: e.target.value
                    .split(",")
                    .map((l) => l.trim())
                    .filter(Boolean),
                }))
              }
              className={inputClass}
            />
          </div>

          <div className="mt-6">
            <p className="text-[15px] font-semibold text-dusk-900">Personal details</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Age</FieldLabel>
                <input
                  type="number"
                  value={draft.age}
                  onChange={(e) => setDraft((d) => ({ ...d, age: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Gender</FieldLabel>
                <input
                  value={draft.gender}
                  onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Nationality</FieldLabel>
                <input
                  value={draft.nationality}
                  onChange={(e) => setDraft((d) => ({ ...d, nationality: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Born city</FieldLabel>
                <input
                  value={draft.bornCity}
                  onChange={(e) => setDraft((d) => ({ ...d, bornCity: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Qualification</FieldLabel>
                <input
                  value={draft.qualification}
                  onChange={(e) => setDraft((d) => ({ ...d, qualification: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>College</FieldLabel>
                <input
                  value={draft.college}
                  onChange={(e) => setDraft((d) => ({ ...d, college: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>School</FieldLabel>
                <input
                  value={draft.school}
                  onChange={(e) => setDraft((d) => ({ ...d, school: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel>Religion</FieldLabel>
                <input
                  value={draft.religion}
                  onChange={(e) => setDraft((d) => ({ ...d, religion: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[15px] font-semibold text-dusk-900">Your rates</p>

            <div className="mt-3">
              <FieldLabel>Chat rate — {draft.rateChat} coins/min</FieldLabel>
              <input
                type="range"
                min={5}
                max={15}
                value={draft.rateChat}
                onChange={(e) => setDraft((d) => ({ ...d, rateChat: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="mt-3">
              <FieldLabel>Audio rate — {draft.rateAudio} coins/min</FieldLabel>
              <input
                type="range"
                min={10}
                max={30}
                value={draft.rateAudio}
                onChange={(e) => setDraft((d) => ({ ...d, rateAudio: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="mt-3">
              <FieldLabel>Video rate — {draft.rateVideo} coins/min</FieldLabel>
              <input
                type="range"
                min={20}
                max={60}
                value={draft.rateVideo}
                onChange={(e) => setDraft((d) => ({ ...d, rateVideo: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <p className="mt-1 text-[12px] text-dusk-400">
              Standard mentors are banded 5–15 / 10–30 / 20–60 coins/min for chat, audio and video, so
              pricing stays consistent for Seekers.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        {saved && <p className="mb-2 text-center text-[13px] text-sage-500">Saved.</p>}
        <PrimaryButton onClick={handleSave}>
          {isOnboarding ? "Finish setting up" : "Save changes"}
        </PrimaryButton>
      </div>

      {!isOnboarding && <MentorBottomNav />}
    </div>
  );
}
