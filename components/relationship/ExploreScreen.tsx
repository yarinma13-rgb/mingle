import Link from "next/link";
import type { UserType } from "@/lib/supabase/types";

type ExploreAction = {
  label: string;
  description: string;
  href: string;
};

function buildActions(
  connectionId: string,
  otherUserId: string,
  viewerType: UserType,
): ExploreAction[] {
  const ownProfileHref = viewerType === "talent" ? "/profile/build" : "/company-profile/build";
  return [
    {
      label: "Have a conversation",
      description: "Jump back into the message thread.",
      href: `/conversations/${connectionId}`,
    },
    {
      label: "Learn about the team",
      description: "See their full profile — how they work, what they value.",
      href: `/profile/view/${otherUserId}`,
    },
    {
      label: "Meet the hiring manager",
      description: "Ask who you'd actually be working with.",
      href: `/conversations/${connectionId}`,
    },
    {
      label: "Explore the opportunity",
      description: "See the role and why this connection developed.",
      href: `/conversations/${connectionId}/opportunity`,
    },
    {
      label: "Ask a question",
      description: "Send a message with what you're curious about.",
      href: `/conversations/${connectionId}`,
    },
    {
      label: "Share more about yourself",
      description: "Keep your own profile current.",
      href: ownProfileHref,
    },
  ];
}

export function ExploreScreen({
  connectionId,
  otherUserId,
  otherName,
  viewerType,
}: {
  connectionId: string;
  otherUserId: string;
  otherName: string;
  viewerType: UserType;
}) {
  const actions = buildActions(connectionId, otherUserId, viewerType);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-mingle-white">
          Explore the relationship
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          A few ways to keep getting to know {otherName.split(" ")[0]}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col gap-1.5 rounded-2xl border border-mingle-border bg-mingle-surface p-5 transition-colors hover:border-mingle-purple/50"
          >
            <p className="font-display text-sm font-semibold text-mingle-white">
              {action.label}
            </p>
            <p className="text-xs text-mingle-text-secondary">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
