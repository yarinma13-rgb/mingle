"use client";

import Image from "next/image";

const CONFETTI = [
  "#EA1E63",
  "#7B2FF7",
  "#3E6BE0",
  "#E2378D",
  "#7362E2",
  "#4D42DB",
  "#EA1E63",
  "#3E6BE0",
  "#7B2FF7",
  "#E2378D",
];

export function LandingHeroMatch() {
  return (
    <div className="landing-match-stage" aria-hidden="true">
      <div className="landing-match-glow" />

      <article className="landing-screen landing-screen-talent">
        <div className="landing-screen-top">
          <span className="landing-avatar landing-avatar-talent" />
          <div>
            <p className="landing-screen-kicker">Talent</p>
            <p className="landing-screen-title">Product craft</p>
          </div>
        </div>
        <ul className="landing-screen-tags">
          <li>Design systems</li>
          <li>B2B SaaS</li>
          <li>Remote first</li>
        </ul>
        <div className="landing-screen-bars">
          <i>
            <b className="fill-role" style={{ width: "90%" }} />
          </i>
          <i>
            <b className="fill-company" style={{ width: "82%" }} />
          </i>
          <i>
            <b className="fill-motivation" style={{ width: "94%" }} />
          </i>
        </div>
      </article>

      <div className="landing-match-center">
        <div className="landing-orbit">
          {CONFETTI.map((color, index) => (
            <span
              key={index}
              className="landing-orbit-piece"
              style={{
                background: color,
                ["--i" as string]: String(index),
              }}
            />
          ))}
        </div>

        <div className="landing-arrows">
          <span className="landing-arrow landing-arrow-ltr" />
          <span className="landing-arrow landing-arrow-rtl" />
        </div>

        <div className="landing-mascot-burst">
          <Image
            src="/mascot/mutual.png"
            alt=""
            width={112}
            height={112}
            className="landing-mascot-img"
            priority
          />
          <p className="landing-mascot-score">94</p>
          <p className="landing-mascot-label">It&apos;s a mingle</p>
        </div>
      </div>

      <article className="landing-screen landing-screen-company">
        <div className="landing-screen-top">
          <span className="landing-avatar landing-avatar-company" />
          <div>
            <p className="landing-screen-kicker">Company</p>
            <p className="landing-screen-title">Series A product team</p>
          </div>
        </div>
        <ul className="landing-screen-tags">
          <li>Weekly shipping</li>
          <li>Tel Aviv</li>
          <li>Ownership</li>
        </ul>
        <div className="landing-screen-bars">
          <i>
            <b className="fill-role" style={{ width: "88%" }} />
          </i>
          <i>
            <b className="fill-company" style={{ width: "86%" }} />
          </i>
          <i>
            <b className="fill-motivation" style={{ width: "91%" }} />
          </i>
        </div>
      </article>
    </div>
  );
}
