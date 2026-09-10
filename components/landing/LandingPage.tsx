import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";
import "./landing.css";

const START_HREF = "/start";
const AUTH_HREF = "/auth";

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-shell landing-nav-inner">
          <Link href="/" className="landing-nav-brand" aria-label="mingle home">
            <MingleLogo variant="lockup" size={40} priority />
          </Link>

          <nav className="landing-nav-links" aria-label="Primary">
            <a href="#fit">The fit</a>
            <a href="#how">How it works</a>
            <a href="#match">Match Report</a>
          </nav>

          <div className="landing-nav-actions">
            <Link href={AUTH_HREF} className="landing-nav-signin">
              Sign in
            </Link>
            <Link href={START_HREF} className="landing-btn landing-btn-primary">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-shell landing-hero-grid">
            <div className="landing-hero-copy">
              <h1 id="landing-hero-title" className="landing-hero-title">
                Transform the way you{" "}
                <span className="landing-hero-title-gradient">connect</span>
              </h1>
              <p className="landing-hero-lead">
                Career relationships that start with a real Match Report, so
                talent and companies talk only when Role Fit, Company Fit, and
                Motivation Fit already line up.
              </p>
              <p className="landing-hero-he" lang="he" dir="rtl">
                קשרים תעסוקתיים שמתחילים בשיחה אמיתית, לא רק בקורות חיים.
              </p>

              <div className="landing-hero-actions">
                <Link
                  href={START_HREF}
                  className="landing-btn landing-btn-primary landing-btn-lg"
                >
                  Get started free
                </Link>
                <Link
                  href={AUTH_HREF}
                  className="landing-btn landing-btn-secondary landing-btn-lg"
                >
                  Sign in
                </Link>
              </div>

              <ul className="landing-hero-proof">
                <li>No credit card required</li>
                <li>Two minutes to get started</li>
              </ul>
            </div>

            <div className="landing-hero-visual" aria-hidden="true">
              <div className="landing-collage">
                <div className="landing-collage-dash">
                  <div className="landing-collage-search">
                    Search talent, roles, conversations
                  </div>
                  <div className="landing-collage-dash-grid">
                    <div className="landing-collage-panel">
                      <p className="landing-collage-kicker">Notifications</p>
                      <div className="landing-collage-row">
                        <span className="landing-avatar landing-avatar-pink">
                          M
                        </span>
                        <div>
                          <strong>New Match Report</strong>
                          <span>Maya scored 88 with your role</span>
                        </div>
                      </div>
                      <div className="landing-collage-row">
                        <span className="landing-avatar landing-avatar-blue">
                          A
                        </span>
                        <div>
                          <strong>Conversation started</strong>
                          <span>Alex replied to your note</span>
                        </div>
                      </div>
                    </div>

                    <div className="landing-collage-panel">
                      <p className="landing-collage-kicker">Top matches</p>
                      <div className="landing-collage-faces">
                        <span className="landing-avatar landing-avatar-pink">
                          M
                        </span>
                        <span className="landing-avatar landing-avatar-purple">
                          J
                        </span>
                        <span className="landing-avatar landing-avatar-blue">
                          R
                        </span>
                        <span className="landing-avatar landing-avatar-violet">
                          S
                        </span>
                      </div>
                      <div className="landing-collage-mini-bars">
                        <div className="landing-mini-bar">
                          <span>Role</span>
                          <i>
                            <b
                              className="landing-mini-fill-role"
                              style={{ width: "92%", display: "block", height: "100%" }}
                            />
                          </i>
                        </div>
                        <div className="landing-mini-bar">
                          <span>Company</span>
                          <i>
                            <b
                              className="landing-mini-fill-company"
                              style={{ width: "84%", display: "block", height: "100%" }}
                            />
                          </i>
                        </div>
                      </div>
                    </div>

                    <div className="landing-collage-panel landing-collage-perf">
                      <p className="landing-collage-kicker">Pipeline mix</p>
                      <div className="landing-donut">
                        <svg viewBox="0 0 120 120" className="landing-donut-svg">
                          <circle
                            cx="60"
                            cy="60"
                            r="40"
                            fill="none"
                            stroke="#eef4fb"
                            strokeWidth="16"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="40"
                            fill="none"
                            stroke="var(--mingle-accent-pink)"
                            strokeWidth="16"
                            strokeDasharray="70 251"
                            transform="rotate(-90 60 60)"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="40"
                            fill="none"
                            stroke="var(--mingle-accent-purple)"
                            strokeWidth="16"
                            strokeDasharray="55 251"
                            strokeDashoffset="-70"
                            transform="rotate(-90 60 60)"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="40"
                            fill="none"
                            stroke="var(--mingle-accent-blue)"
                            strokeWidth="16"
                            strokeDasharray="40 251"
                            strokeDashoffset="-125"
                            transform="rotate(-90 60 60)"
                          />
                        </svg>
                        <div className="landing-donut-center">
                          <strong>24</strong>
                          <span>active</span>
                        </div>
                      </div>
                      <ul className="landing-donut-legend">
                        <li>
                          <i className="landing-dot-role" /> Exploring
                        </li>
                        <li>
                          <i className="landing-dot-company" /> In conversation
                        </li>
                        <li>
                          <i className="landing-dot-motivation" /> Opportunity
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <article className="landing-float landing-float-match">
                  <div className="landing-mock-top">
                    <div>
                      <div className="landing-mock-label">Match Report</div>
                      <p className="landing-mock-name">
                        Maya · Product Designer
                      </p>
                    </div>
                    <div className="landing-mock-score">
                      <strong>88</strong>
                      <span>Strong Match</span>
                    </div>
                  </div>
                  <div className="landing-mock-bars">
                    <div className="landing-mock-bar-row">
                      <div className="landing-mock-bar-meta">
                        <span>Role Fit</span>
                        <span>92</span>
                      </div>
                      <div className="landing-mock-track">
                        <div className="landing-mock-fill landing-mock-fill-role" />
                      </div>
                    </div>
                    <div className="landing-mock-bar-row">
                      <div className="landing-mock-bar-meta">
                        <span>Company Fit</span>
                        <span>84</span>
                      </div>
                      <div className="landing-mock-track">
                        <div className="landing-mock-fill landing-mock-fill-company" />
                      </div>
                    </div>
                    <div className="landing-mock-bar-row">
                      <div className="landing-mock-bar-meta">
                        <span>Motivation Fit</span>
                        <span>88</span>
                      </div>
                      <div className="landing-mock-track">
                        <div className="landing-mock-fill landing-mock-fill-motivation" />
                      </div>
                    </div>
                  </div>
                </article>

                <article className="landing-float landing-float-activity">
                  <p className="landing-collage-kicker">My activities</p>
                  <div className="landing-activity-row">
                    <span className="landing-activity-icon">1</span>
                    <div>
                      <strong>Follow up with Maya</strong>
                      <span>Match Report ready to review</span>
                    </div>
                    <em>Today</em>
                  </div>
                  <div className="landing-activity-row">
                    <span className="landing-activity-icon">2</span>
                    <div>
                      <strong>Intro call with Alex</strong>
                      <span>In conversation stage</span>
                    </div>
                    <em>Thu</em>
                  </div>
                  <div className="landing-activity-row">
                    <span className="landing-activity-icon">3</span>
                    <div>
                      <strong>Share role brief</strong>
                      <span>Product Designer · Tel Aviv</span>
                    </div>
                    <em>Fri</em>
                  </div>
                </article>

                <article className="landing-float landing-float-company">
                  <span className="landing-avatar landing-avatar-purple">R</span>
                  <div>
                    <strong>Northwind Labs</strong>
                    <div className="landing-float-tags">
                      <span className="landing-tag landing-tag-blue">
                        Series A
                      </span>
                      <span className="landing-tag landing-tag-pink">
                        Product
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-trust" aria-label="Trusted by teams">
          <div className="landing-shell">
            <p className="landing-trust-copy">
              Built for teams that hire through relationships, not spray and
              pray.
            </p>
            <div className="landing-trust-row">
              <span>Talent teams</span>
              <span>Founders</span>
              <span>Agencies</span>
              <span>Operators</span>
              <span>People leaders</span>
            </div>
          </div>
        </section>

        <section id="fit" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-head">
              <h2>Three fits. One conversation worth having.</h2>
              <p>
                mingle scores the relationship across Role Fit, Company Fit, and
                Motivation Fit before either side spends a week in interviews.
              </p>
            </div>
            <div className="landing-fit-grid">
              <article className="landing-fit-card">
                <div
                  className="landing-fit-dot landing-fit-dot-role"
                  aria-hidden
                />
                <h3>Role Fit</h3>
                <p>
                  Career goals, industry, and experience lined up with what the
                  seat actually needs day to day.
                </p>
              </article>
              <article className="landing-fit-card">
                <div
                  className="landing-fit-dot landing-fit-dot-company"
                  aria-hidden
                />
                <h3>Company Fit</h3>
                <p>
                  Work style, location, and stage preference that match how the
                  team really builds and decides.
                </p>
              </article>
              <article className="landing-fit-card">
                <div
                  className="landing-fit-dot landing-fit-dot-motivation"
                  aria-hidden
                />
                <h3>Motivation Fit</h3>
                <p>
                  Values and drivers that stay true after the first call, not
                  only on a polished profile page.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="how" className="landing-section landing-section-tight">
          <div className="landing-shell">
            <div className="landing-section-head">
              <h2>From profile to conversation in three steps</h2>
              <p>Equal depth for talent and companies. No swipe theater.</p>
            </div>
            <div className="landing-steps">
              <article className="landing-step">
                <div className="landing-step-num" aria-hidden>
                  1
                </div>
                <h3>Build your side</h3>
                <p>
                  Share goals, motivations, and how you work so the Match Report
                  has something real to score.
                </p>
              </article>
              <article className="landing-step">
                <div className="landing-step-num" aria-hidden>
                  2
                </div>
                <h3>See who fits</h3>
                <p>
                  Discover people and teams with Role, Company, and Motivation
                  Fit already on the table.
                </p>
              </article>
              <article className="landing-step">
                <div className="landing-step-num" aria-hidden>
                  3
                </div>
                <h3>Start the relationship</h3>
                <p>
                  Connect, explore, and decide together. Careers start with
                  connection, not a cold application.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="match" className="landing-section">
          <div className="landing-shell landing-deep">
            <div className="landing-deep-copy">
              <h2>A Match Report you can act on</h2>
              <p>
                Not a black box score. Clear axes, clear reasons, and a shared
                language for both sides before the first meeting.
              </p>
              <ul className="landing-deep-list">
                <li>
                  Overall match with confidence, not a mysterious percentage
                  alone.
                </li>
                <li>
                  Role, Company, and Motivation Fit broken out so you know what
                  to talk about.
                </li>
                <li>
                  Why it fits and where it might not, so nobody walks in blind.
                </li>
              </ul>
            </div>

            <article
              className="landing-match-card"
              aria-label="Sample Match Report"
            >
              <div className="landing-match-card-head">
                <h3>Match Report</h3>
                <span className="landing-match-pill">Strong Match</span>
              </div>
              <div className="landing-match-overall">
                <strong>88</strong>
                <span>out of 100</span>
              </div>
              <div className="landing-match-axes">
                <div className="landing-match-axis">
                  <span>Role Fit</span>
                  <div className="landing-match-axis-track">
                    <div
                      className="landing-match-axis-fill"
                      style={{
                        width: "92%",
                        background: "var(--mingle-accent-pink)",
                      }}
                    />
                  </div>
                  <span>92</span>
                </div>
                <div className="landing-match-axis">
                  <span>Company Fit</span>
                  <div className="landing-match-axis-track">
                    <div
                      className="landing-match-axis-fill"
                      style={{
                        width: "84%",
                        background: "var(--mingle-accent-purple)",
                      }}
                    />
                  </div>
                  <span>84</span>
                </div>
                <div className="landing-match-axis">
                  <span>Motivation Fit</span>
                  <div className="landing-match-axis-track">
                    <div
                      className="landing-match-axis-fill"
                      style={{
                        width: "88%",
                        background: "var(--mingle-accent-blue)",
                      }}
                    />
                  </div>
                  <span>88</span>
                </div>
              </div>
              <p className="landing-match-note">
                What matters most here: ownership of end to end product craft,
                and a team that already ships in weekly loops.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-banner">
          <div className="landing-shell">
            <div className="landing-banner-inner">
              <div>
                <h2>Ready to meet who is worth talking to?</h2>
                <p>
                  Create your free profile, pick talent or company, and open
                  your first Match Report.
                </p>
              </div>
              <Link
                href={START_HREF}
                className="landing-btn landing-btn-on-gradient"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div className="landing-footer-links">
            <Link href={START_HREF}>Get started</Link>
            <Link href="/legal/terms">Terms of Service</Link>
            <Link href="/legal/privacy">Privacy Policy</Link>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} mingle
          </p>
        </div>
      </footer>
    </div>
  );
}
