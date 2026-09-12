"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { MingleLogo } from "@/components/MingleLogo";
import {
  LandingAudienceProvider,
  LandingHeroCopy,
  LandingHeroMatch,
} from "@/components/landing/LandingHeroMatch";
import { LandingCompanyBoard } from "@/components/landing/LandingCompanyBoard";
import {
  LandingLanguageSwitch,
  LandingLocaleProvider,
  useLandingLocale,
} from "@/components/landing/LandingLocale";
import "./landing.css";

const poppins = Poppins({
  // Poppins has no Hebrew glyphs in next/font; Latin + system Hebrew fallback.
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-landing-poppins",
  display: "swap",
});

const AUTH_HREF = "/start";
const DEMO_HREF = "/contact";

function LandingPageInner() {
  const { t, locale } = useLandingLocale();
  const year = new Date().getFullYear();

  return (
    <div
      className={`landing ${poppins.variable}`}
      dir={t.dir}
      lang={locale}
      data-locale={locale}
    >
      <header className="landing-nav">
        <div className="landing-shell landing-nav-inner">
          <Link href="/" className="landing-nav-brand" aria-label="mingle home">
            <MingleLogo variant="mark" size={30} priority />
            <span className="landing-nav-wordmark">mingle</span>
          </Link>

          <nav className="landing-nav-links" aria-label="Primary">
            <a href="#why">{t.nav.why}</a>
            <a href="#how">{t.nav.how}</a>
            <a href="#why-match">{t.nav.whyMatch}</a>
            <a href="#compare">{t.nav.compare}</a>
            <a href="#faq">{t.nav.faq}</a>
          </nav>

          <div className="landing-nav-actions">
            <LandingLanguageSwitch />
            <Link href={AUTH_HREF} className="landing-nav-signin">
              {t.nav.signIn}
            </Link>
            <Link href={DEMO_HREF} className="landing-btn landing-btn-ghost">
              {t.nav.bookDemo}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-shell landing-hero-grid">
            <LandingAudienceProvider>
              <LandingHeroCopy />
              <div className="landing-hero-visual">
                <LandingHeroMatch />
              </div>
            </LandingAudienceProvider>
          </div>
        </section>

        <LandingCompanyBoard />

        <section id="why" className="landing-section landing-section-soft">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>{t.why.title}</h2>
              <p>{t.why.lead}</p>
            </div>
            <div className="landing-fit-grid">
              {t.why.cards.map((card, index) => (
                <article key={card.title} className="landing-fit">
                  <span
                    className={`landing-fit-dot ${
                      index === 0
                        ? "fill-role"
                        : index === 1
                          ? "fill-company"
                          : "fill-motivation"
                    }`}
                    aria-hidden
                  />
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>{t.how.title}</h2>
              <p>{t.how.lead}</p>
            </div>
            <ol className="landing-steps">
              {t.how.steps.map((step, index) => (
                <li key={step.title}>
                  <span className="landing-step-num">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="why-match" className="landing-section landing-section-tint">
          <div className="landing-shell landing-split">
            <div className="landing-split-copy">
              <h2>{t.whyMatch.title}</h2>
              <p>{t.whyMatch.lead}</p>
              <ul className="landing-checklist">
                {t.whyMatch.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <article
              className="landing-report landing-why-card"
              aria-label={t.whyMatch.cardTitle}
            >
              <div className="landing-report-top">
                <h3>{t.whyMatch.cardTitle}</h3>
                <span>{t.whyMatch.cardBadge}</span>
              </div>
              <ul className="landing-why-list landing-why-list-lg">
                {t.whyMatch.reasons.map((reason) => (
                  <li
                    key={reason.text}
                    className={reason.tone === "warn" ? "is-warn" : "is-good"}
                  >
                    {reason.text}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="landing-section landing-section-soft">
          <div className="landing-shell landing-split">
            <article className="landing-report" aria-label={t.scores.cardTitle}>
              <div className="landing-report-top">
                <h3>{t.scores.cardTitle}</h3>
                <span>{t.scores.cardBadge}</span>
              </div>
              <div className="landing-report-score">
                <strong>94</strong>
                <span>{t.scores.overall}</span>
              </div>
              <div className="landing-product-bars">
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>{t.scores.role}</span>
                    <span>97%</span>
                  </div>
                  <i>
                    <b style={{ width: "97%" }} className="fill-role" />
                  </i>
                </div>
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>{t.scores.human}</span>
                    <span>92%</span>
                  </div>
                  <i>
                    <b style={{ width: "92%" }} className="fill-company" />
                  </i>
                </div>
                <div className="landing-product-bar">
                  <div className="landing-product-bar-meta">
                    <span>{t.scores.motivation}</span>
                    <span>94%</span>
                  </div>
                  <i>
                    <b style={{ width: "94%" }} className="fill-motivation" />
                  </i>
                </div>
              </div>
            </article>
            <div className="landing-split-copy">
              <h2>{t.scores.title}</h2>
              <p>{t.scores.lead}</p>
              <ul className="landing-checklist">
                {t.scores.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="dna" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>{t.dna.title}</h2>
              <p>{t.dna.lead}</p>
            </div>
            <div className="landing-fit-grid landing-dna-grid">
              {t.dna.cards.map((card, index) => (
                <article key={card.title} className="landing-fit">
                  <span
                    className={`landing-fit-dot ${
                      index === 0
                        ? "fill-company"
                        : index === 1
                          ? "fill-role"
                          : "fill-motivation"
                    }`}
                    aria-hidden
                  />
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="moment" className="landing-section">
          <div className="landing-shell landing-moment">
            <div className="landing-moment-copy">
              <p className="landing-moment-eyebrow">{t.moment.eyebrow}</p>
              <h2>{t.moment.title}</h2>
              <p>{t.moment.lead}</p>
              <ul className="landing-checklist">
                {t.moment.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="landing-moment-card" aria-hidden="true">
              <div className="landing-moment-pair">
                <span className="landing-avatar landing-avatar-talent" />
                <span className="landing-moment-link" />
                <span className="landing-avatar landing-avatar-company" />
              </div>
              <p className="landing-moment-score">{t.moment.unlocked}</p>
              <p className="landing-moment-sub">{t.moment.scoresLine}</p>
            </div>
          </div>
        </section>

        <section id="compare" className="landing-section landing-section-soft">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>{t.compare.title}</h2>
              <p>{t.compare.lead}</p>
            </div>
            <div className="landing-compare-wrap">
              <table className="landing-compare">
                <thead>
                  <tr>
                    {t.compare.columns.map((col, index) => (
                      <th
                        key={`${col}-${index}`}
                        className={index === 1 ? "is-mingle" : undefined}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.compare.rows.map((row) => (
                    <tr key={row.feature}>
                      <th scope="row">{row.feature}</th>
                      <td className="is-mingle">{row.mingle}</td>
                      <td>{row.ats}</td>
                      <td>{row.linkedin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="faq" className="landing-section">
          <div className="landing-shell">
            <div className="landing-section-head landing-section-head-center">
              <h2>{t.faq.title}</h2>
              <p>{t.faq.lead}</p>
            </div>
            <div className="landing-faq-list">
              {t.faq.items.map((item) => (
                <details key={item.q} className="landing-faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-banner">
          <div className="landing-shell">
            <div className="landing-banner-inner">
              <h2>{t.banner.title}</h2>
              <p>{t.banner.lead}</p>
              <div className="landing-banner-actions">
                <Link
                  href={AUTH_HREF}
                  className="landing-btn landing-btn-primary landing-btn-lg"
                >
                  {t.banner.getStarted}
                </Link>
                <Link
                  href={DEMO_HREF}
                  className="landing-btn landing-btn-ghost landing-btn-lg"
                >
                  {t.banner.bookDemo}
                </Link>
              </div>
              <p className="landing-banner-note">{t.banner.freeLine}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-grid">
          <div className="landing-footer-brand">
            <MingleLogo variant="mark" size={28} />
            <span className="landing-nav-wordmark">mingle</span>
            <p className="landing-footer-free">{t.footer.freeTalent}</p>
          </div>
          <div>
            <p className="landing-footer-label">{t.footer.product}</p>
            <div className="landing-footer-links">
              <a href="#why">{t.footer.why}</a>
              <a href="#how">{t.footer.how}</a>
              <a href="#compare">{t.footer.compare}</a>
              <a href="#faq">{t.footer.faq}</a>
            </div>
          </div>
          <div>
            <p className="landing-footer-label">{t.footer.company}</p>
            <div className="landing-footer-links">
              <Link href={DEMO_HREF}>{t.footer.bookDemo}</Link>
              <Link href={DEMO_HREF}>{t.footer.contact}</Link>
              <Link href={AUTH_HREF}>{t.footer.signIn}</Link>
            </div>
          </div>
          <div>
            <p className="landing-footer-label">{t.footer.legal}</p>
            <div className="landing-footer-links">
              <Link href="/legal/terms">{t.footer.terms}</Link>
              <Link href="/legal/privacy">{t.footer.privacy}</Link>
            </div>
          </div>
        </div>
        <div className="landing-shell landing-footer-bottom">
          <p className="landing-footer-copy">
            © {year} {t.footer.rights}
          </p>
          <LandingLanguageSwitch />
        </div>
      </footer>
    </div>
  );
}

export function LandingPage() {
  return (
    <LandingLocaleProvider>
      <LandingPageInner />
    </LandingLocaleProvider>
  );
}
