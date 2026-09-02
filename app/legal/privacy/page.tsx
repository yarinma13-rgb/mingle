import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — mingle",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="1 September 2026">
      <p>
        This Privacy Policy explains how mingle handles personal data during
        the closed pilot. It should be read with the{" "}
        <Link href="/legal/terms">Terms of Service</Link>.
      </p>

      <h2>Who this applies to</h2>
      <p>
        It applies to people who create a talent or company account, and to
        anyone whose details are entered into a company profile with their
        knowledge.
      </p>

      <h2>What we collect</h2>
      <p>Depending on how you use mingle, we may process:</p>
      <ul className="list-disc space-y-2 ps-5">
        <li>account data: email address, password hash (via our auth provider), chosen path (talent or company)</li>
        <li>
          profile data: name, headline, location, experience, industry, bio,
          motivations, work style, career goals, company mission and culture
        </li>
        <li>
          activity data: saved profiles, connection requests and their
          status, messages, relationship events, and timestamps
        </li>
        <li>
          technical data: session cookies required to keep you signed in
        </li>
      </ul>
      <p>
        We do not currently collect payment information. Profile photos and
        CV files are designed in the product but file storage may not be
        active in this pilot build.
      </p>

      <h2>Why we use it</h2>
      <p>We process this data to:</p>
      <ul className="list-disc space-y-2 ps-5">
        <li>create and secure your account</li>
        <li>show your profile to the other side of the platform</li>
        <li>compute and explain match factors</li>
        <li>deliver connections, conversations, and relationship stages</li>
        <li>operate, debug, and improve the pilot</li>
      </ul>
      <p>
        The legal bases we rely on are performing the Service you asked for,
        our legitimate interest in running a safe pilot, and any consent you
        give for optional features.
      </p>

      <h2>Where it is stored</h2>
      <p>
        Authentication, database, and realtime messaging are provided by
        Supabase (PostgreSQL). The Next.js application may be hosted on a
        cloud platform such as Vercel when the pilot is deployed. Those
        providers process data on our instructions as infrastructure
        processors.
      </p>

      <h2>Who can see your profile</h2>
      <p>
        Talent profiles are visible to signed in company users, and company
        profiles are visible to signed in talent users, according to the
        access rules in the database. Messages are visible only to the two
        people in that conversation. We do not sell your data.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep pilot account and activity data for the duration of the
        pilot and a reasonable period afterwards so we can close the
        programme fairly. You can ask us to delete your account and
        associated profile data.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update most profile fields in the product. You can decline
        or cancel connections. Depending on applicable law you may also ask
        to access, correct, or delete personal data, or to object to certain
        processing. Use the same channel you were invited to the pilot on.
      </p>

      <h2>Children</h2>
      <p>
        mingle is for working professionals. It is not intended for anyone
        under 18.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Policy as the pilot evolves. The date at the top
        of this page will change when we do.
      </p>

      <p>
        This Policy is a working draft for the pilot and should be reviewed
        by counsel before a wider launch.
      </p>
    </LegalShell>
  );
}
