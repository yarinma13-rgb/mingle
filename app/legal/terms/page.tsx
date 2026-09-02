import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — mingle",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="1 September 2026">
      <p>
        These Terms govern your use of mingle, a career relationship platform
        currently offered as a closed pilot. By creating an account or using
        the Service you agree to these Terms.
      </p>

      <h2>Who we are</h2>
      <p>
        mingle is operated as a pilot product. The operator of the Service
        (we, us) provides mingle so talent and companies can discover each
        other, connect, and build a professional relationship over time.
      </p>

      <h2>The Service</h2>
      <p>
        mingle is not a job board and not a guarantee of employment, hiring,
        or any specific outcome. Profiles, match explanations, messages, and
        relationship stages are tools for conversation. You remain responsible
        for your own hiring and career decisions.
      </p>
      <p>
        The pilot may change, pause, or end. Features may be incomplete. We
        will try to keep the Service reliable, but we do not promise
        uninterrupted availability.
      </p>

      <h2>Your account</h2>
      <p>
        You must provide accurate information and keep your login details
        private. You are responsible for activity under your account. Do not
        create an account for someone else without their permission.
      </p>
      <p>
        Talent and company paths are separate. Use the path that matches how
        you intend to participate in the pilot.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc space-y-2 ps-5">
        <li>misrepresent who you are, who you work for, or your role</li>
        <li>
          scrape, harvest, or bulk export other people&rsquo;s profiles
        </li>
        <li>harass, spam, or pressure anyone on the Service</li>
        <li>
          upload unlawful, discriminatory, or confidential content you are not
          allowed to share
        </li>
        <li>attempt to bypass security or access another account</li>
      </ul>
      <p>
        We may suspend or close an account that breaks these rules, or that
        puts other pilot participants at risk.
      </p>

      <h2>Content you share</h2>
      <p>
        You keep ownership of the profile text, messages, and other content
        you submit. You grant us a licence to host, display, and process that
        content only as needed to operate mingle (for example showing your
        profile to the other side, delivering messages, and recording
        relationship events).
      </p>
      <p>
        Do not share secrets, unpublished offers, or personal data about
        third parties without a lawful basis.
      </p>

      <h2>Connections and messages</h2>
      <p>
        Sending a connection, accepting one, or starting a conversation is
        your choice. The other person may decline, cancel, or stop
        participating. We do not mediate employment disputes.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The Service is provided as is during the pilot. To the fullest extent
        allowed by law we disclaim warranties of fitness for a particular
        purpose, merchantability, and non infringement. Match scores are
        explanations, not advice.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent allowed by law we are not liable for lost
        profits, lost opportunity, or indirect damages arising from your use
        of mingle. Our total liability for claims related to the Service is
        limited to zero because the pilot is offered without charge, unless a
        mandatory law says otherwise.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms as the pilot evolves. The date at the top
        of this page will change when we do. Continued use after an update
        means you accept the new Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms can be sent to the operator of mingle
        through the channel you were invited to the pilot on.
      </p>
      <p>
        These Terms are a working draft for the pilot and should be reviewed
        by counsel before a wider launch.
      </p>
    </LegalShell>
  );
}
