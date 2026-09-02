type IconProps = { className?: string; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function GridIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function BriefcaseIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  );
}

export function PeopleIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.75 19a6.25 6.25 0 0 1 12.5 0" />
      <path d="M15.5 5.5a3.25 3.25 0 0 1 0 6.4" />
      <path d="M17.5 13.5a6.2 6.2 0 0 1 3.75 5.5" />
    </svg>
  );
}

export function ColumnsIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <rect x="3.5" y="4" width="4.5" height="16" rx="1" />
      <rect x="9.75" y="4" width="4.5" height="16" rx="1" />
      <rect x="16" y="4" width="4.5" height="16" rx="1" />
    </svg>
  );
}

export function FunnelIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M3.5 4.5h17L14 12.5v6l-4 2v-8L3.5 4.5Z" />
    </svg>
  );
}

export function CalendarIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function GearIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.7 6.3l-1.7 1.7M8 16l-1.7 1.7M17.7 17.7 16 16M8 8 6.3 6.3" />
    </svg>
  );
}

export function SearchIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function BellIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function TargetIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function GaugeIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M3.5 15.5a8.5 8.5 0 0 1 17 0" />
      <path d="M12 15.5 15.5 10" />
      <path d="M3.5 15.5h17" />
    </svg>
  );
}

export function ClockIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function CheckCircleIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m8.5 12.3 2.3 2.3 4.7-5.1" />
    </svg>
  );
}

export function BookmarkIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function MessageIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M4 5.5h16v11H9.5L5 20v-3.5H4v-11Z" />
    </svg>
  );
}

export function UserIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function CompassIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.25" />
      <path d="m14.8 9.2-1.6 4-4 1.6 1.6-4Z" />
    </svg>
  );
}

export function MoreIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
