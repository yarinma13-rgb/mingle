import Link from "next/link";
import { Poppins } from "next/font/google";
import { MingleLogo } from "@/components/MingleLogo";
import {
  LandingHeroCopy,
  LandingHeroMatch,
} from "@/components/landing/LandingHeroMatch";
import "./landing.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-landing-poppins",
  display: "swap",
});

const AUTH_HREF = "/start";
const DEMO_HREF = "/contact";

export function LandingPage() {
  return (
    <div className={`landing ${poppins.variable}`}>
      <header className="landing-nav">
        <div className="landing-shell landing-nav-inner">
          <Link href="/" className="landing-nav-brand" aria-label="mingle home">
            <MingleLogo variant="mark" size={30} priority />
            <span className="landing-nav-wordmark">mingle</span>
          </Link>

          <nav className="landing-nav-links" aria-label="Primary">
            <a href="#why">Why mingle</a>
            <a href="#how">How it works</a>
            <a href="#why-match">Why this match</a>
          </nav>

          <div className="landing-nav-actions">
            <Link href={AUTH_HREF} className="landing-nav-signin">
              Sign in
            </Link>
            <Link href={DEMO_HREF} className="landing-btn landing-btn-ghost">
              Book a demo
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-shell landing-hero-grid">
            <LandingHeroCopy />
            <div className="landing-hero-visual">
              <LandingHeroMatch />
            </div>
          </div>
        </section>

        <section id="why" className="landing-section landing-section-soft">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>More intelligence behind the scenes. Almost no friction up front.</h2>
              <p>
                Built first for hiring teams who want speed without fifteen fields.
                Open to talent who want clearer reasons than a black box score.
                Infer what you can. Ask only what is critical. Explain every
                recommendation.
              </p>
            </div>

            <div className="landing-fit-grid">
              <article className="landing-fit">
                <span className="landing-fit-dot fill-role" aria-hidden />
                <h3>Sixty second start</h3>
                <p>
                  Paste a job description or a role link. Find my matches. No
                  culture questionnaire. No fifteen field onboarding.
                </p>
              </article>
              <article className="landing-fit">
                <span className="landing-fit-dot fill-company" aria-hidden />
                <h3>DNA, not forms</h3>
                <p>
                  Company DNA, Candidate DNA, and Role DNA are built from jobs,
                  profiles, signals, and outcomes. The recruiter does not fill a
                  culture survey.
                </p>
              </article>
              <article className="landing-fit">
                <span className="landing-fit-dot fill-motivation" aria-hidden />
                <h3>Ask only when stuck</h3>
                <p>
                  If something critical is unclear, mingle asks one short
                  question. Must have, nice to have, or does not matter. Then it
                  ranks.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="how" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>Create a role. See the right people. Know why.</h2>
              <p>
                Built for hiring teams who want fewer CVs and better conversations.
                When interest is mutual, talent sees the same clear Why this match.
              </p>
            </div>

            <ol className="landing-steps">
              <li>
                <span className="landing-step-num">1</span>
                <div>
                  <h3>Paste the job</h3>
                  <p>
                    Drop in a job description or link. mingle extracts role,
                    seniority, skills, must haves, and the quiet signals in the
                    wording.
                  </p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">2</span>
                <div>
                  <h3>Get Strong Matches</h3>
                  <p>
                    Within seconds you see ranked people with Overall Match,
                    Role Fit, Human Fit, Motivation Fit, and Match Confidence.
                  </p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">3</span>
                <div>
                  <h3>Read Why this match</h3>
                  <p>
                    Open a candidate and see the strengths, the one real risk,
                    and why this person deserves your time.
                  </p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">4</span>
                <div>
                  <h3>Mark interest</h3>
                  <p>
                    Interested or not relevant. Mutual interest unlocks the
                    conversation. Outcomes feed the Learning Engine later.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section id="why-match" className="landing-section landing-section-tint">
          <div className="landing-shell landing-split">
            <div className="landing-split-copy">
              <h2>Why this match?</h2>
              <p>
                Not another black box percentage. Hiring teams see why someone
                belongs on the short list. Talent sees why a role might fit them
                too, including the risk that could break it.
              </p>
              <ul className="landing-checklist">
                <li>Core skills, stage, ownership, salary, and career direction</li>
                <li>One honest concern when preferences may clash</li>
                <li>Match Confidence so a thin profile never looks certain</li>
              </ul>
            </div>

            <article className="landing-report landing-why-card" aria-label="Why this match example">
              <div className="landing-report-top">
                <h3>Why mingle recommends this candidate</h3>
                <span>96% · High confidence</span>
              </div>
              <ul className="landing-why-list landing-why-list-lg">
                <li className="is-good">5/5 core skills</li>
                <li className="is-good">Experience in a similar company stage</li>
                <li className="is-good">Looking for high ownership</li>
                <li className="is-good">Your role offers exactly that</li>
                <li className="is-good">Salary expectations align</li>
                <li className="is-good">Career direction matches the role</li>
                <li className="is-warn">
                  Prefers remote first work. This role asks for 3 office days.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="landing-section landing-section-soft">
          <div className="landing-shell landing-split">
            <article className="landing-report" aria-label="Sample Match Report">
              <div className="landing-report-top">
                <h3>Three scores. One overall.</h3>
                <span>94% Match</span>
              </div>
              <div className="landing-report-score">
                <strong>94</strong>
                <span>Overall · High confidence</span>
              </div>
              <div className="landing-product-bars">
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>Role Fit</span>
                    <span>97%</span>
                  </div>
                  <i>
                    <b style={{ width: "97%" }} className="fill-role" />
                  </i>
                </div>
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>Human Fit</span>
                    <span>92%</span>
                  </div>
                  <i>
                    <b style={{ width: "92%" }} className="fill-company" />
                  </i>
                </div>
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>Motivation Fit</span>
                    <span>94%</span>
                  </div>
                  <i>
                    <b style={{ width: "94%" }} className="fill-motivation" />
                  </i>
                </div>
              </div>
            </article>

            <div className="landing-split-copy">
              <h2>Can they do it. Will they thrive. Do they want it.</h2>
              <p>
                Role Fit asks if they can do the work. Human Fit asks if they fit
                the company and environment. Motivation Fit asks if they truly
                want this path. No seventeen score dashboard.
              </p>
              <ul className="landing-checklist">
                <li>DNA to DNA matching, not only CV to job description</li>
                <li>Confidence that stays humble when data is thin</li>
                <li>A shared language before anyone books an interview</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="dna" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>Company DNA. Candidate DNA. Role DNA.</h2>
              <p>
                Culture and values still matter on both sides. Hiring teams should
                not fill a form first, and talent should not answer fifteen culture
                questions to get started. mingle discovers the DNA, then compares.
              </p>
            </div>

            <div className="landing-fit-grid landing-dna-grid">
              <article className="landing-fit">
                <span className="landing-fit-dot fill-company" aria-hidden />
                <h3>Company DNA</h3>
                <p>
                  Work style, management, environment, and what succeeds here.
                  Learned from jobs, careers pages, signals, and later outcomes.
                </p>
              </article>
              <article className="landing-fit">
                <span className="landing-fit-dot fill-role" aria-hidden />
                <h3>Candidate DNA</h3>
                <p>
                  Skills, trajectory, preferences, and goals inferred from CV,
                  profile, applications, interactions, and feedback.
                </p>
              </article>
              <article className="landing-fit">
                <span className="landing-fit-dot fill-motivation" aria-hidden />
                <h3>Role DNA</h3>
                <p>
                  Explicit requirements plus the quiet ones, like high autonomy
                  when a job says work closely with founders.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="moment" className="landing-section landing-section-moment">
          <div className="landing-shell landing-moment">
            <div className="landing-moment-copy">
              <p className="landing-moment-eyebrow">After mutual interest</p>
              <h2>Then the conversation becomes intelligence too.</h2>
              <p>
                Matching comes first. When both sides are interested, a short
                mingle conversation can surface alignment, misalignment, and the
                next useful question. That is stage two, not the first ask.
              </p>
              <ul className="landing-checklist">
                <li>Mutual interest before the first deep chat</li>
                <li>A Match Report both sides can read</li>
                <li>Outcomes that teach the Learning Engine over time</li>
              </ul>
            </div>

            <div className="landing-moment-card" aria-hidden="true">
              <div className="landing-moment-pair">
                <span className="landing-avatar landing-avatar-talent" />
                <span className="landing-moment-link" />
                <span className="landing-avatar landing-avatar-company" />
              </div>
              <p className="landing-moment-score">Mutual interest unlocked</p>
              <p className="landing-moment-sub">
                Role 97 · Human 92 · Motivation 94
              </p>
            </div>
          </div>
        </section>

        <section className="landing-banner">
          <div className="landing-shell">
            <div className="landing-banner-inner">
              <h2>The right people, faster.</h2>
              <p>
                mingle helps hiring teams find the few people worth talking to in
                seconds, and helps talent understand when a role is worth their
                time. Not a perfect match promise. A clearer short list, with
                reasons both sides can trust.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div className="landing-footer-brand">
            <MingleLogo variant="mark" size={28} />
            <span className="landing-nav-wordmark">mingle</span>
          </div>
          <div className="landing-footer-links">
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} mingle
          </p>
        </div>
      </footer>
    </div>
  );
}
