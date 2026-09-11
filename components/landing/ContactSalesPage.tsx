"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

const COMPANY_SIZES = [
  "1–19",
  "20–49",
  "50–99",
  "100–299",
  "300–999",
  "1000+",
] as const;

const EXPLORE_OPTIONS = [
  "Private pilot for open roles",
  "Recruiter workflow demo",
  "Founder hiring support",
  "Agency / talent partner",
  "Something else",
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  companyName: string;
  companySize: string;
  explore: string;
  message: string;
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  workEmail: "",
  jobTitle: "",
  companyName: "",
  companySize: "",
  explore: "",
  message: "",
};

export function ContactSalesPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <div className="landing contact-page">
      <header className="landing-nav">
        <div className="landing-shell landing-nav-inner">
          <Link href="/" className="landing-nav-brand" aria-label="mingle home">
            <MingleLogo variant="mark" size={30} priority />
            <span className="landing-nav-wordmark">mingle</span>
          </Link>
          <div className="landing-nav-actions">
            <Link href="/auth" className="landing-nav-signin">
              Sign in
            </Link>
            <Link href="/auth?mode=signup" className="landing-btn landing-btn-ghost">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="contact-main">
        <div className="landing-shell contact-grid">
          <section className="contact-copy" aria-labelledby="contact-title">
            <p className="contact-eyebrow">Book a demo</p>
            <h1 id="contact-title" className="contact-title">
              See mingle on a real open role
            </h1>
            <p className="contact-lead">
              Paste a role. Get the few people worth talking to. Understand
              why — Role Fit, Human Fit, and Motivation Fit in one clear
              report.
            </p>

            <ul className="contact-benefits">
              <li>Live Top Matches walkthrough on your hiring brief</li>
              <li>Why this match — including the one honest risk</li>
              <li>Company DNA and Candidate DNA without long forms</li>
            </ul>

            <div className="contact-proof">
              <div className="contact-proof-avatars" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>
                Built for hiring teams who want speed without fifteen fields.
              </p>
            </div>
          </section>

          <section className="contact-form-panel" aria-label="Demo request form">
            {submitted ? (
              <div className="contact-success" role="status">
                <p className="contact-eyebrow">Request received</p>
                <h2>Thanks — we will be in touch</h2>
                <p>
                  Someone from mingle will reach out shortly to schedule a short
                  walkthrough on a role you are hiring for.
                </p>
                <Link href="/" className="landing-btn landing-btn-primary">
                  Back to mingle
                </Link>
              </div>
            ) : (
              <form className="contact-form" onSubmit={onSubmit} noValidate>
                <div className="contact-form-head">
                  <h2>Request a walkthrough</h2>
                  <p>Takes about a minute. No long questionnaire.</p>
                </div>

                <div className="contact-form-row">
                  <label>
                    <span>First name *</span>
                    <input
                      name="firstName"
                      autoComplete="given-name"
                      required
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Last name *</span>
                    <input
                      name="lastName"
                      autoComplete="family-name"
                      required
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                    />
                  </label>
                </div>

                <label>
                  <span>Work email *</span>
                  <input
                    type="email"
                    name="workEmail"
                    autoComplete="email"
                    required
                    value={form.workEmail}
                    onChange={(e) => update("workEmail", e.target.value)}
                  />
                </label>

                <div className="contact-form-row">
                  <label>
                    <span>Job title</span>
                    <input
                      name="jobTitle"
                      autoComplete="organization-title"
                      value={form.jobTitle}
                      onChange={(e) => update("jobTitle", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Company size *</span>
                    <select
                      name="companySize"
                      required
                      value={form.companySize}
                      onChange={(e) => update("companySize", e.target.value)}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {COMPANY_SIZES.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span>Company name *</span>
                  <input
                    name="companyName"
                    autoComplete="organization"
                    required
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                  />
                </label>

                <label>
                  <span>What would you like to explore? *</span>
                  <select
                    name="explore"
                    required
                    value={form.explore}
                    onChange={(e) => update("explore", e.target.value)}
                  >
                    <option value="" disabled>
                      Select an option
                    </option>
                    {EXPLORE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Anything we should know?</span>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Open roles, hard-to-fill positions, or what you want to see"
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className="landing-btn landing-btn-primary landing-btn-lg contact-submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Book a demo"}
                </button>

                <p className="contact-legal">
                  By submitting, you agree to be contacted by mingle about a
                  demo. See our <Link href="/legal/privacy">Privacy</Link>{" "}
                  policy.
                </p>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
