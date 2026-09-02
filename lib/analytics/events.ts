export const AnalyticsEvent = {
  signup: "signup",
  signIn: "sign_in",
  profileCompleted: "profile_completed",
  connectionSent: "connection_sent",
  mingleCreated: "mingle_created",
  messageSent: "message_sent",
  relationshipStage: "relationship_stage",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
