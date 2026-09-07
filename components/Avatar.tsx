"use client";

import { TalentPhotoImg } from "@/components/profile/TalentPhotoImg";
import {
  avatarToneClass,
  type Gender,
} from "@/lib/profile/avatar";

const SIZES = {
  sm: { box: "h-9 w-9", text: "text-xs" },
  md: { box: "h-11 w-11", text: "text-sm" },
  lg: { box: "h-12 w-12", text: "text-sm" },
  xl: { box: "h-20 w-20", text: "text-xl" },
} as const;

export function Avatar({
  photo = null,
  initials,
  gender = null,
  size = "md",
}: {
  photo?: string | null;
  initials: string;
  gender?: Gender | null;
  size?: keyof typeof SIZES;
}) {
  const dim = SIZES[size];
  const label = initials.trim() || "?";
  return (
    <TalentPhotoImg
      photo={photo}
      className={`${dim.box} shrink-0 rounded-full object-cover`}
      fallback={
        <div
          className={`flex ${dim.box} shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${dim.text} ${avatarToneClass(gender)}`}
        >
          {label}
        </div>
      }
    />
  );
}
