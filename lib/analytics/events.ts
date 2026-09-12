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
  passwordResetRequested: "password_reset_requested",

  // Discover / match actions
  matchInterested: "match_interested",
  matchNotFit: "match_not_fit",
  matchSkipped: "match_skipped",
  matchRestored: "match_restored",
  profileSaved: "profile_saved",

  // Onboarding
  onboardingStepCompleted: "onboarding_step_completed",
  onboardingCompleted: "onboarding_completed",

  // Relationship UI
  relationshipTabClicked: "relationship_tab_clicked",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
