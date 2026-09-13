export type UserType = "talent" | "company";
export type OnboardingStatus = "not_started" | "in_progress" | "completed";
export type ConnectionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

export type AppUser = {
  id: string;
  email: string;
  user_type: UserType;
  onboarding_status: OnboardingStatus;
  onboarding_step: number;
  profile_completion: number;
};

export type ConnectionRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
};
