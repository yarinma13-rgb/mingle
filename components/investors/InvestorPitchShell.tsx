"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import {
  PITCH_FOLDERS,
  type PitchFolderId,
  getFolder,
} from "@/lib/investors/folders";
import { PitchPlayer } from "@/components/investors/PitchPlayer";
import "./investors.css";

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5L8 5.5z" />
    </svg>
  );
}

export function InvestorPitchShell() {
  const [openId, setOpenId] = useState<PitchFolderId | null>(null);
  const openFolder = openId ? getFolder(openId) : null;

  useEffect(() => {
    if (!openId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openId]);

  return (
    <div className="inv">
      <div className="inv-shell">
        <nav className="inv-nav" aria-label="Investor brief">
          <a className="inv-nav-mark" href="/investors">
            <MingleLogo size={34} priority />
            <span className="inv-nav-word">mingle</span>
          </a>
          <span className="inv-nav-pill">Investor Brief</span>
        </nav>

        <header className="inv-hero">
          <div className="inv-hero-bg" aria-hidden />
          <div>
            <p className="inv-hero-brand">mingle</p>
            <h1 className="inv-hero-title inv-he" dir="rtl">
              Mutual Match Intelligence למי שמשקיע בעתיד של גיוס
            </h1>
            <p className="inv-hero-lead inv-he" dir="rtl">
              פתחו תיקייה — הדמו קופץ. Play. כ־50 שניות על כל נושא, בסדר של פגישת
              משקיעים.
            </p>
            <button
              type="button"
              className="inv-hero-cta"
              onClick={() => setOpenId("founder")}
            >
              <PlayGlyph />
              Start with the founder
            </button>
          </div>
        </header>

        <section className="inv-desk" id="folders" aria-labelledby="desk-title">
          <div className="inv-desk-head">
            <div>
              <p className="inv-desk-kicker">Meeting flow</p>
              <h2 className="inv-desk-title inv-he" id="desk-title" dir="rtl">
                תיקיות הנושאים
              </h2>
            </div>
            <p className="inv-desk-hint inv-he" dir="rtl">
              לחצו על תיקייה → הסרטון נפתח. המידע המורחב חי בתוך הדמו, לא על
              השולחן.
            </p>
          </div>

          <div className="inv-folders">
            {PITCH_FOLDERS.map((folder, index) => (
              <motion.button
                key={folder.id}
                type="button"
                className={`inv-folder inv-accent-${folder.accent}`}
                onClick={() => setOpenId(folder.id)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.04, duration: 0.45 }}
                whileHover={{ y: -6 }}
              >
                <span className="inv-folder-tab" aria-hidden />
                <span className="inv-folder-body">
                  {folder.preview ? (
                    <span
                      className="inv-folder-preview"
                      style={{ backgroundImage: `url(${folder.preview})` }}
                      aria-hidden
                    />
                  ) : null}
                  <span className="inv-folder-num">
                    {String(folder.order).padStart(2, "0")}
                  </span>
                  <span className="inv-folder-label inv-he" dir="rtl">
                    {folder.labelHe}
                  </span>
                  <span className="inv-folder-en" dir="ltr">
                    {folder.labelEn}
                  </span>
                  <span className="inv-folder-meta">
                    <span>{folder.durationLabel}</span>
                    <span className="inv-folder-play" aria-hidden>
                      <PlayGlyph />
                    </span>
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        <footer className="inv-footer inv-he" dir="rtl">
          <div>
            <strong>mingle</strong> · Ideas are what shape the world
          </div>
          <div>Confidential · For investor conversations</div>
        </footer>
      </div>

      <AnimatePresence>
        {openFolder ? (
          <PitchPlayer
            key={openFolder.id}
            folder={openFolder}
            onClose={() => setOpenId(null)}
            onOpenFolder={(id) => setOpenId(id)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
