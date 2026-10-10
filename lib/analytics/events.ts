/**
 * Product analytics event catalog.
 * Keep names snake_case and stable — dashboards depend on them.
 */
export const AnalyticsEvent = {
  // Core funnel (already wired in persistence / auth)
  signup: "signup",
  signIn: "sign_in",
  profileCompleted: "profile_completed",
  connectionSent: "connection_sent",
  mingleCreated: "mingle_created",
  messageSent: "message_sent",
  relationshipStage: "relationship_stage",

  // Landing / acquisition
  audienceTabSelected: "audience_tab_selected",
  landingCtaClicked: "landing_cta_clicked",
  landingLocaleChanged: "landing_locale_changed",
  landingSectionViewed: "landing_section_viewed",
  landingNavClicked: "landing_nav_clicked",

  // Welcome path picker
  welcomePathSelected: "welcome_path_selected",

  // Auth UI
  authModeToggled: "auth_mode_toggled",
  authSubmitClicked: "auth_submit_clicked",
  authPathConfirmShown: "auth_path_confirm_shown",
  authPathConfirmed: "auth_path_confirmed",
  authPathSwitched: "auth_path_switched",
  authGoogleClicked: "auth_google_clicked",
  passwordResetRequested: "password_reset_requested",

  // Company Aha! foundation (funnel later in PostHog UI)
  roleCreated: "role_created",
  matchViewed: "match_viewed",

  // Discover / match actions
  matchInterested: "match_interested",
  matchNotFit: "match_not_fit",
  matchSkipped: "match_skipped",
  matchRestored: "match_restored",
  profileSaved: "profile_saved",

  // Onboarding
  onboardingStarted: "onboarding_started",
  onboardingStepCompleted: "onboarding_step_completed",
  onboardingCompleted: "onboarding_completed",
  onboardingAbandoned: "onboarding_abandoned",

  // Profile build (the longer wizard after onboarding preferences)
  profileStarted: "profile_started",
  profileStepCompleted: "profile_step_completed",

  // Referral (existing role_referrals mechanism had no analytics events)
  referralStarted: "referral_started",
  referralSignup: "referral_signup",

  // Notifications
  notificationOpened: "notification_opened",

  // Discover / activation
  discoverViewed: "discover_viewed",
  matchCardViewed: "match_card_viewed",
  boardStageChanged: "board_stage_changed",
  returningSession: "returning_session",

  // Relationship UI
  relationshipTabClicked: "relationship_tab_clicked",

  // Support
  supportReportSubmitted: "support_report_submitted",

  // Rediscovery
  candidateRediscovered: "candidate_rediscovered",

  // Talent → talent referrals
  talentReferralLinkViewed: "talent_referral_link_viewed",
  talentReferralOpened: "talent_referral_opened",
  talentReferralSignupStarted: "talent_referral_signup_started",
  talentReferralSignupCompleted: "talent_referral_signup_completed",
  talentReferralInviteShown: "talent_referral_invite_shown",
  talentReferralInviteOpened: "talent_referral_invite_opened",
  talentReferralInviteDismissed: "talent_referral_invite_dismissed",
  talentReferralShared: "talent_referral_shared",
  talentReferralCtaClicked: "talent_referral_cta_clicked",
  talentReferralProfileCompleted: "talent_referral_profile_completed",
  talentReferralMatched: "talent_referral_matched",

  // Post-rejection talent exchange
  candidateVisibilityChanged: "candidate_visibility_changed",
  talentExchangeOpportunitiesFound: "talent_exchange_opportunities_found",
  talentExchangeCompanyInterested: "talent_exchange_company_interested",
  talentExchangeCandidateResponded: "talent_exchange_candidate_responded",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
