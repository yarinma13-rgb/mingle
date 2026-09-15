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
  hero: { box: "h-24 w-24", text: "text-xl" },
} as const;

const SHAPE = {
  circle: "rounded-full",
  soft: "rounded-2xl",
} as const;

export function Avatar({
  photo = null,
  initials,
  gender = null,
  size = "md",
  shape = "circle",
}: {
  photo?: string | null;
  initials: string;
  gender?: Gender | null;
  size?: keyof typeof SIZES;
  /** Company marks use soft corners; people stay circular. */
  shape?: keyof typeof SHAPE;
}) {
  const dim = SIZES[size];
  const radius = SHAPE[shape];
  const label = initials.trim() || "?";
  const fit = shape === "soft" ? "object-contain" : "object-cover";
  const plate =
    shape === "soft"
      ? "bg-[#0B0B0F] p-1.5 ring-1 ring-black/20"
      : "bg-white ring-1 ring-black/[0.04]";
  return (
    <TalentPhotoImg
      photo={photo}
      className={`${dim.box} shrink-0 ${radius} ${fit} ${plate} shadow-[0_8px_24px_rgba(45,27,78,0.08)]`}
      fallback={
        <div
          className={`flex ${dim.box} shrink-0 items-center justify-center ${radius} font-display font-bold text-white ${dim.text} ${avatarToneClass(gender)} shadow-[0_8px_24px_rgba(45,27,78,0.08)]`}
        >
          {label}
        </div>
      }
    />
  );
}
