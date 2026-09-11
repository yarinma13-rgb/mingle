"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

const COMPANY_SIZES = [
  "1 to 19",
  "20 to 49",
  "50 to 99",
  "100 to 299",
  "300 to 999",
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
    // Client side capture for now. Wire to CRM / email later.
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
            <Link href="/start" className="landing-btn landing-btn-ghost">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="contact-main">
        <div className="landing-shell contact-grid">
          <section className="contact-copy" aria-labelledby="contact-title">
            <p className="landing-hero-eyebrow">Book a demo</p>
            <h1 id="contact-title" className="contact-title">
              Talk with our team to see how mingle can fit your hiring
            </h1>
            <p className="contact-lead">
              Paste a role, get the few people worth talking to, and understand
              why. We will walk you through a live match report on a real open
              role.
            </p>

            <ul className="contact-benefits">
              <li>
                See Top Matches with Role Fit, Human Fit, and Motivation Fit
              </li>
              <li>Review Why this match, including the one honest risk</li>
              <li>
                Learn how Company DNA and Candidate DNA work without long forms
              </li>
            </ul>

            <figure className="contact-quote">
              <blockquote>
                I do not need another ATS. I need fewer wasted interviews and a
                short list I can trust.
              </blockquote>
              <figcaption>Talent lead · Growth stage company</figcaption>
            </figure>
          </section>

          <section className="contact-form-panel" aria-label="Contact form">
            {submitted ? (
              <div className="contact-success" role="status">
                <h2>Thanks. We got your request.</h2>
                <p>
                  Someone from mingle will reach out shortly to schedule a short
                  walkthrough on a role you are hiring for.
                </p>
                <Link href="/welcome" className="landing-btn landing-btn-primary">
                  Back to mingle
                </Link>
              </div>
            ) : (
              <form className="contact-form" onSubmit={onSubmit} noValidate>
                <h2>Contact our team</h2>

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
                  <span>Company size *</span>
                  <select
                    name="companySize"
                    required
                    value={form.companySize}
                    onChange={(e) => update("companySize", e.target.value)}
                  >
                    <option value="" disabled>
                      Select company size
                    </option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
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
                  <span>Tell us more about your hiring needs</span>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Open roles, hard to fill positions, or what you want to see in the demo"
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </label>

                <button
                  type="submit"
                  className="landing-btn landing-btn-primary landing-btn-lg contact-submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Submit"}
                </button>

                <p className="contact-legal">
                  By submitting this form, you agree to be contacted by mingle
                  about a demo and related product updates. See our{" "}
                  <Link href="/legal/privacy">Privacy</Link> policy.
                </p>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
