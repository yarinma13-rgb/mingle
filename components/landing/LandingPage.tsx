import Link from "next/link";
import { Poppins } from "next/font/google";
import { MingleLogo } from "@/components/MingleLogo";
import { LandingHeroMatch } from "@/components/landing/LandingHeroMatch";
import "./landing.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing-poppins",
  display: "swap",
});

const START_HREF = "/start";
const AUTH_HREF = "/auth";
const DEMO_HREF = "/start?intent=demo";

export function LandingPage() {
  return (
    <div className={`landing ${poppins.variable}`}>
      <header className="landing-nav">
        <div className="landing-shell landing-nav-inner">
          <Link href="/" className="landing-nav-brand" aria-label="mingle home">
            <MingleLogo variant="lockup" size={36} priority />
          </Link>

          <nav className="landing-nav-links" aria-label="Primary">
            <a href="#why">Why mingle</a>
            <a href="#how">How it works</a>
            <a href="#moment">The mingle moment</a>
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
            <div className="landing-hero-copy">
              <h1 id="landing-hero-title" className="landing-hero-title">
                Talent and companies choosing each other with{" "}
                <span className="landing-hero-highlight">confidence</span>
              </h1>
              <p className="landing-hero-lead">
                The relationship workspace where Role Fit, Company Fit, and
                Motivation Fit turn hiring into conversations worth having.
              </p>

              <ul className="landing-audience" aria-label="Who mingle is for">
                <li className="is-active">Talent</li>
                <li>Companies</li>
                <li>Founders</li>
                <li>Recruiters</li>
                <li>Agencies</li>
              </ul>

              <div className="landing-hero-actions">
                <Link
                  href={START_HREF}
                  className="landing-btn landing-btn-primary landing-btn-lg landing-btn-rainbow-pulse"
                >
                  Get Started
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <p className="landing-hero-note">
                No credit card needed ✦ Free to open your first Match Report
              </p>
            </div>

            <div className="landing-hero-visual">
              <LandingHeroMatch />
            </div>
          </div>
        </section>

        <section className="landing-trust" aria-label="Trusted by teams">
          <div className="landing-shell">
            <p className="landing-trust-copy">
              Trusted by relationship first teams hiring across startups and
              scaleups
            </p>
            <ul className="landing-trust-row">
              <li>Northwind</li>
              <li>Brightline</li>
              <li>Orbit Labs</li>
              <li>Cedar Co</li>
              <li>PulseHire</li>
              <li>Studio Nine</li>
            </ul>
          </div>
        </section>

        <section id="why" className="landing-section landing-section-soft">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>Three fits. One conversation worth having.</h2>
              <p>
                Stop spraying applications into the void. mingle scores the
                relationship before either side spends a week in interviews.
              </p>
            </div>

            <div className="landing-fit-grid">
              <article className="landing-fit">
                <span className="landing-fit-dot fill-role" aria-hidden />
                <h3>Role Fit</h3>
                <p>
                  Career goals, industry, and experience lined up with what the
                  seat actually needs day to day.
                </p>
              </article>
              <article className="landing-fit">
                <span className="landing-fit-dot fill-company" aria-hidden />
                <h3>Company Fit</h3>
                <p>
                  Work style, location, and stage preference that match how the
                  team really builds and decides.
                </p>
              </article>
              <article className="landing-fit">
                <span className="landing-fit-dot fill-motivation" aria-hidden />
                <h3>Motivation Fit</h3>
                <p>
                  Values and drivers that stay true after the first call, not
                  only on a polished profile page.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="moment" className="landing-section landing-section-moment">
          <div className="landing-shell landing-moment">
            <div className="landing-moment-copy">
              <p className="landing-moment-eyebrow">The mingle moment</p>
              <h2>When both sides choose each other, celebrate it.</h2>
              <p>
                Mutual interest unlocks a shared Match Report, clear next
                steps, and a little spark of joy. No ghosting theater. No cold
                inboxes. Just two screens leaning toward the same yes.
              </p>
              <ul className="landing-checklist">
                <li>Bidirectional interest before the first call</li>
                <li>A Match Report both sides can read together</li>
                <li>Confetti when it is actually a mingle</li>
              </ul>
            </div>

            <div className="landing-moment-card" aria-hidden="true">
              <div className="landing-moment-pair">
                <span className="landing-avatar landing-avatar-talent" />
                <span className="landing-moment-link" />
                <span className="landing-avatar landing-avatar-company" />
              </div>
              <p className="landing-moment-score">Strong mutual match</p>
              <p className="landing-moment-sub">Role 92 · Company 86 · Motivation 90</p>
            </div>
          </div>
        </section>

        <section id="how" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>Match. Explore. Experience. Decide.</h2>
              <p>
                A clear path from first signal to a real decision, with equal
                depth for talent and companies.
              </p>
            </div>

            <ol className="landing-steps">
              <li>
                <span className="landing-step-num">1</span>
                <div>
                  <h3>Match</h3>
                  <p>
                    Build your side once. See who already lines up across the
                    three fits.
                  </p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">2</span>
                <div>
                  <h3>Explore</h3>
                  <p>
                    Open a Match Report together. Talk about the real gaps and
                    strengths first.
                  </p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">3</span>
                <div>
                  <h3>Experience</h3>
                  <p>
                    Move through the relationship with context, not cold
                    applications and silence.
                  </p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">4</span>
                <div>
                  <h3>Decide</h3>
                  <p>
                    Choose with confidence when both sides already know why it
                    might work.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="landing-section landing-section-tint">
          <div className="landing-shell landing-split">
            <div className="landing-split-copy">
              <h2>A Match Report you can act on</h2>
              <p>
                Not a black box score. Clear axes, clear reasons, and a shared
                language before the first meeting.
              </p>
              <ul className="landing-checklist">
                <li>
                  Overall match with confidence, not a mysterious percentage
                  alone
                </li>
                <li>
                  Role, Company, and Motivation Fit broken out for both sides
                </li>
                <li>
                  Why it fits and where it might not, so nobody walks in blind
                </li>
              </ul>
            </div>

            <article className="landing-report" aria-label="Sample Match Report">
              <div className="landing-report-top">
                <h3>Match Report</h3>
                <span>Strong Match</span>
              </div>
              <div className="landing-report-score">
                <strong>94</strong>
                <span>out of 100</span>
              </div>
              <div className="landing-product-bars">
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>Role Fit</span>
                    <span>92</span>
                  </div>
                  <i>
                    <b style={{ width: "92%" }} className="fill-role" />
                  </i>
                </div>
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>Company Fit</span>
                    <span>86</span>
                  </div>
                  <i>
                    <b style={{ width: "86%" }} className="fill-company" />
                  </i>
                </div>
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>Motivation Fit</span>
                    <span>90</span>
                  </div>
                  <i>
                    <b style={{ width: "90%" }} className="fill-motivation" />
                  </i>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="landing-banner">
          <div className="landing-shell">
            <div className="landing-banner-inner">
              <h2>Ready to meet who is worth talking to?</h2>
              <p>
                Create your free profile, choose talent or company, and open
                your first Match Report. Prefer a walkthrough first? Use Book a
                demo above.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <MingleLogo variant="lockup" size={32} />
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
