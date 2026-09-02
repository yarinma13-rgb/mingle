export type UserType = "talent" | "company";
export type OnboardingStatus = "not_started" | "in_progress" | "completed";
export type ConnectionStatus = "pending" | "accepted" | "declined" | "cancelled";
export type RelationshipStage =
  | "connected"
  | "exploring"
  | "in_conversation"
  | "opportunity"
  | "decision"
  | "relationship";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          user_type: UserType;
          onboarding_status: OnboardingStatus;
          onboarding_step: number;
          profile_completion: number;
          created_at: string;
          updated_at: string;
          last_active_at: string;
        };
        Insert: {
          id: string;
          email: string;
          user_type: UserType;
          onboarding_status?: OnboardingStatus;
          onboarding_step?: number;
          profile_completion?: number;
        };
        Update: {
          user_type?: UserType;
          onboarding_status?: OnboardingStatus;
          onboarding_step?: number;
          profile_completion?: number;
          last_active_at?: string;
        };
        Relationships: [];
      };
      talent_preferences: {
        Row: {
          id: string;
          talent_id: string;
          career_goals: string | null;
          motivations: string[];
          company_types: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          talent_id: string;
          career_goals?: string | null;
          motivations?: string[];
          company_types?: string[];
        };
        Update: {
          career_goals?: string | null;
          motivations?: string[];
          company_types?: string[];
        };
        Relationships: [];
      };
      company_preferences: {
        Row: {
          id: string;
          company_id: string;
          hiring_needs: string | null;
          culture_priorities: string[];
          talent_types: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          hiring_needs?: string | null;
          culture_priorities?: string[];
          talent_types?: string[];
        };
        Update: {
          hiring_needs?: string | null;
          culture_priorities?: string[];
          talent_types?: string[];
        };
        Relationships: [];
      };
      talent_profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          headline: string | null;
          location: string | null;
          profile_photo: string | null;
          years_experience: number | null;
          current_job_title: string | null;
          industry: string | null;
          drives: string[];
          work_style: string[];
          looking_for: string[];
          beyond_cv: string | null;
          cv_path: string | null;
          cv_file_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          headline?: string | null;
          location?: string | null;
          profile_photo?: string | null;
          years_experience?: number | null;
          current_job_title?: string | null;
          industry?: string | null;
          drives?: string[];
          work_style?: string[];
          looking_for?: string[];
          beyond_cv?: string | null;
          cv_path?: string | null;
          cv_file_name?: string | null;
        };
        Update: {
          first_name?: string | null;
          last_name?: string | null;
          headline?: string | null;
          location?: string | null;
          profile_photo?: string | null;
          years_experience?: number | null;
          current_job_title?: string | null;
          industry?: string | null;
          drives?: string[];
          work_style?: string[];
          looking_for?: string[];
          beyond_cv?: string | null;
          cv_path?: string | null;
          cv_file_name?: string | null;
        };
        Relationships: [];
      };
      company_profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string | null;
          logo: string | null;
          mission: string | null;
          industry: string | null;
          company_stage: string | null;
          company_size: string | null;
          location: string | null;
          work_environment: string[];
          values: string[];
          who_thrives_here: string | null;
          description: string | null;
          looking_for: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          company_name?: string | null;
          logo?: string | null;
          mission?: string | null;
          industry?: string | null;
          company_stage?: string | null;
          company_size?: string | null;
          location?: string | null;
          work_environment?: string[];
          values?: string[];
          who_thrives_here?: string | null;
          description?: string | null;
          looking_for?: string[];
        };
        Update: {
          company_name?: string | null;
          logo?: string | null;
          mission?: string | null;
          industry?: string | null;
          company_stage?: string | null;
          company_size?: string | null;
          location?: string | null;
          work_environment?: string[];
          values?: string[];
          who_thrives_here?: string | null;
          description?: string | null;
          looking_for?: string[];
        };
        Relationships: [];
      };
      saved_profiles: {
        Row: {
          id: string;
          user_id: string;
          saved_user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          saved_user_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          recipient_id: string;
          status: ConnectionStatus;
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          requester_id: string;
          recipient_id: string;
          status?: ConnectionStatus;
          message?: string | null;
        };
        Update: {
          status?: ConnectionStatus;
          requester_id?: string;
          recipient_id?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          connection_id: string;
          created_at: string;
        };
        Insert: {
          connection_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          conversation_id: string;
          sender_id: string;
          body: string;
        };
        Update: {
          read_at?: string | null;
        };
        Relationships: [];
      };
      relationship_events: {
        Row: {
          id: string;
          connection_id: string;
          stage: RelationshipStage;
          actor_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          connection_id: string;
          stage: RelationshipStage;
          actor_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
