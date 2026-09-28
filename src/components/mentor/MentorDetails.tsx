"use client";

import { useState } from "react";
import {
  Calendar,
  UsersThree,
  Globe,
  BookOpen,
  MapPin,
  Certificate,
  House,
  HeartStraight,
} from "@phosphor-icons/react";
import { Mentor } from "@/lib/types";

function DetailTile({
  icon: Icon,
  iconBg,
  iconFg,
  label,
  value,
}: {
  icon: typeof Calendar;
  iconBg: string;
  iconFg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl2 border border-linen-200 bg-card p-3.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>
        <Icon size={16} className={iconFg} />
      </div>
      <p className="mt-2 text-[12px] text-dusk-400">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-dusk-900">{value}</p>
    </div>
  );
}

export function PersonalDetails({ mentor }: { mentor: Mentor }) {
  const tiles: { icon: typeof Calendar; iconBg: string; iconFg: string; label: string; value?: string }[] = [
    { icon: Calendar, iconBg: "bg-sky-50", iconFg: "text-sky-600", label: "Age", value: String(mentor.age) },
    { icon: UsersThree, iconBg: "bg-violet-50", iconFg: "text-violet-600", label: "Gender", value: mentor.gender },
    { icon: Globe, iconBg: "bg-sage-400/10", iconFg: "text-sage-500", label: "Nationality", value: mentor.nationality },
    { icon: BookOpen, iconBg: "bg-amber-50", iconFg: "text-amber-600", label: "Languages", value: mentor.languages.join(", ") },
    { icon: MapPin, iconBg: "bg-warmth-50", iconFg: "text-warmth-600", label: "Born City", value: mentor.bornCity },
    { icon: Certificate, iconBg: "bg-indigo-50", iconFg: "text-indigo-600", label: "Qualification", value: mentor.qualification },
    { icon: BookOpen, iconBg: "bg-sky-50", iconFg: "text-sky-600", label: "College", value: mentor.college },
    { icon: House, iconBg: "bg-sky-50", iconFg: "text-sky-600", label: "School", value: mentor.school },
    { icon: HeartStraight, iconBg: "bg-warmth-50", iconFg: "text-warmth-600", label: "Religion", value: mentor.religion },
  ].filter((t) => t.value);

  return (
    <div>
      <h2 className="text-[20px] font-bold text-dusk-900">Personal details</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <DetailTile key={t.label} {...t} value={t.value!} />
        ))}
      </div>
    </div>
  );
}

export function AboutSection({ mentor }: { mentor: Mentor }) {
  const [expanded, setExpanded] = useState(false);
  const truncated = mentor.bio.length > 140 && !expanded;

  return (
    <div>
      <h2 className="text-[20px] font-bold text-dusk-900">About</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-dusk-800">
        {truncated ? `${mentor.bio.slice(0, 140)}…` : mentor.bio}
      </p>
      {mentor.bio.length > 140 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="tap-target mt-1 text-[13px] font-semibold text-sky-600"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {mentor.communicationTags.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[20px] font-bold text-dusk-900">Communication</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {mentor.communicationTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[12px] font-medium text-sky-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {mentor.personalityTags.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[20px] font-bold text-dusk-900">Personality</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {mentor.personalityTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-sage-400/20 bg-sage-400/10 px-3 py-1.5 text-[12px] font-medium text-sage-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
