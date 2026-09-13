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

export type RoleStatus = "open" | "paused" | "closed";
export type RoleEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance";

export type RecommendationStatus = "pending" | "submitted";
export type RecommendationDelivery = "whatsapp" | "email";
export type CompanyMemberRole = "owner" | "hr" | "team_lead" | "member";
export type CompanyMemberStatus = "invited" | "active";
export type InterviewLocationType = "video" | "in_person";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";

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
          gender: string | null;
          birth_date: string | null;
          salary_expectation: number | null;
          skills: string[];
          latitude: number | null;
          longitude: number | null;
          max_commute_km: number | null;
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
          gender?: string | null;
          birth_date?: string | null;
          salary_expectation?: number | null;
          skills?: string[];
          latitude?: number | null;
          longitude?: number | null;
          max_commute_km?: number | null;
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
          gender?: string | null;
          birth_date?: string | null;
          salary_expectation?: number | null;
          skills?: string[];
          latitude?: number | null;
          longitude?: number | null;
          max_commute_km?: number | null;
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
          latitude: number | null;
          longitude: number | null;
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
          latitude?: number | null;
          longitude?: number | null;
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
          latitude?: number | null;
          longitude?: number | null;
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
      match_feedback: {
        Row: {
          id: string;
          actor_id: string;
          target_user_id: string;
          action: "interested" | "not_fit";
          reason: string | null;
          free_text: string | null;
          created_at: string;
        };
        Insert: {
          actor_id: string;
          target_user_id: string;
          action: "interested" | "not_fit";
          reason?: string | null;
          free_text?: string | null;
        };
        Update: {
          action?: "interested" | "not_fit";
          reason?: string | null;
          free_text?: string | null;
        };
        Relationships: [];
      };

      rediscovered_matches: {
        Row: {
          id: string;
          role_id: string;
          company_id: string;
          candidate_id: string;
          prior_signal: "interested" | "mutual" | "in_conversation";
          prior_role_id: string | null;
          prior_role_title: string | null;
          prior_at: string | null;
          score: number | null;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          role_id: string;
          company_id: string;
          candidate_id: string;
          prior_signal: "interested" | "mutual" | "in_conversation";
          prior_role_id?: string | null;
          prior_role_title?: string | null;
          prior_at?: string | null;
          score?: number | null;
          notified_at?: string | null;
        };
        Update: {
          prior_signal?: "interested" | "mutual" | "in_conversation";
          prior_role_id?: string | null;
          prior_role_title?: string | null;
          prior_at?: string | null;
          score?: number | null;
          notified_at?: string | null;
        };
        Relationships: [];
      };
      match_reviews: {
        Row: {
          id: string;
          role_id: string;
          company_id: string;
          candidate_id: string;
          job_title: string | null;
          company_name: string | null;
          candidate_name: string | null;
          status: "pending" | "approved" | "rejected" | "flagged";
          note: string | null;
          overall: number | null;
          role_fit: number | null;
          company_fit: number | null;
          motivation_fit: number | null;
          confidence: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          role_id: string;
          company_id: string;
          candidate_id: string;
          job_title?: string | null;
          company_name?: string | null;
          candidate_name?: string | null;
          status?: "pending" | "approved" | "rejected" | "flagged";
          note?: string | null;
          overall?: number | null;
          role_fit?: number | null;
          company_fit?: number | null;
          motivation_fit?: number | null;
          confidence?: string | null;
        };
        Update: {
          status?: "pending" | "approved" | "rejected" | "flagged";
          note?: string | null;
          overall?: number | null;
          role_fit?: number | null;
          company_fit?: number | null;
          motivation_fit?: number | null;
          confidence?: string | null;
          job_title?: string | null;
          company_name?: string | null;
          candidate_name?: string | null;
        };
        Relationships: [];
      };
      match_review_audit: {
        Row: {
          id: string;
          review_id: string;
          actor_id: string;
          actor_email: string | null;
          action: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          review_id: string;
          actor_id: string;
          actor_email?: string | null;
          action: string;
          note?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      model_versions: {
        Row: {
          id: string;
          model_name: string;
          version: string;
          embedding_model: string | null;
          ranking_model: string | null;
          feature_version: string | null;
          weights_json: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          model_name: string;
          version: string;
          embedding_model?: string | null;
          ranking_model?: string | null;
          feature_version?: string | null;
          weights_json?: Record<string, unknown>;
        };
        Update: {
          model_name?: string;
          version?: string;
          embedding_model?: string | null;
          ranking_model?: string | null;
          feature_version?: string | null;
          weights_json?: Record<string, unknown>;
        };
        Relationships: [];
      };
      match_feature_snapshots: {
        Row: {
          id: string;
          match_id: string | null;
          features_json: Record<string, unknown>;
          model_version: string | null;
          created_at: string;
        };
        Insert: {
          match_id?: string | null;
          features_json?: Record<string, unknown>;
          model_version?: string | null;
        };
        Update: {
          match_id?: string | null;
          features_json?: Record<string, unknown>;
          model_version?: string | null;
        };
        Relationships: [];
      };
      match_evidence: {
        Row: {
          id: string;
          match_id: string | null;
          feature: string | null;
          evidence_type: string | null;
          source: string | null;
          source_reference: string | null;
          candidate_value: string | null;
          company_value: string | null;
          contribution: number | null;
          confidence: string | null;
          created_at: string;
        };
        Insert: {
          match_id?: string | null;
          feature?: string | null;
          evidence_type?: string | null;
          source?: string | null;
          source_reference?: string | null;
          candidate_value?: string | null;
          company_value?: string | null;
          contribution?: number | null;
          confidence?: string | null;
        };
        Update: {
          match_id?: string | null;
          feature?: string | null;
          evidence_type?: string | null;
          source?: string | null;
          source_reference?: string | null;
          candidate_value?: string | null;
          company_value?: string | null;
          contribution?: number | null;
          confidence?: string | null;
        };
        Relationships: [];
      };
      interview_feedback: {
        Row: {
          id: string;
          match_id: string | null;
          interviewer_id: string | null;
          technical_fit: number | null;
          role_fit: number | null;
          team_fit: number | null;
          motivation_fit: number | null;
          recommendation: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          match_id?: string | null;
          interviewer_id?: string | null;
          technical_fit?: number | null;
          role_fit?: number | null;
          team_fit?: number | null;
          motivation_fit?: number | null;
          recommendation?: string | null;
          notes?: string | null;
        };
        Update: {
          match_id?: string | null;
          interviewer_id?: string | null;
          technical_fit?: number | null;
          role_fit?: number | null;
          team_fit?: number | null;
          motivation_fit?: number | null;
          recommendation?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      employment_outcomes: {
        Row: {
          id: string;
          match_id: string | null;
          hire_date: string | null;
          day_30_status: string | null;
          day_30_feedback: string | null;
          day_90_status: string | null;
          day_90_feedback: string | null;
          retained: boolean | null;
          satisfaction_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          match_id?: string | null;
          hire_date?: string | null;
          day_30_status?: string | null;
          day_30_feedback?: string | null;
          day_90_status?: string | null;
          day_90_feedback?: string | null;
          retained?: boolean | null;
          satisfaction_score?: number | null;
        };
        Update: {
          match_id?: string | null;
          hire_date?: string | null;
          day_30_status?: string | null;
          day_30_feedback?: string | null;
          day_90_status?: string | null;
          day_90_feedback?: string | null;
          retained?: boolean | null;
          satisfaction_score?: number | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: {
          endpoint?: string;
          p256dh?: string;
          auth?: string;
        };
        Relationships: [];
      };
      passed_profiles: {
        Row: {
          id: string;
          user_id: string;
          passed_user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          passed_user_id: string;
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
      roles: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          department: string | null;
          seniority: string | null;
          employment_type: RoleEmploymentType | null;
          work_model: string | null;
          required_skills: string[];
          description: string | null;
          status: RoleStatus;
          salary_min: number | null;
          salary_max: number | null;
          source_jd: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          title: string;
          department?: string | null;
          seniority?: string | null;
          employment_type?: RoleEmploymentType | null;
          work_model?: string | null;
          required_skills?: string[];
          description?: string | null;
          status?: RoleStatus;
          salary_min?: number | null;
          salary_max?: number | null;
          source_jd?: string | null;
          source_url?: string | null;
        };
        Update: {
          title?: string;
          department?: string | null;
          seniority?: string | null;
          employment_type?: RoleEmploymentType | null;
          work_model?: string | null;
          required_skills?: string[];
          description?: string | null;
          status?: RoleStatus;
          salary_min?: number | null;
          salary_max?: number | null;
          source_jd?: string | null;
          source_url?: string | null;
        };
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          candidate_id: string;
          token: string;
          recommender_name: string;
          recommender_contact: string;
          delivery_method: RecommendationDelivery;
          status: RecommendationStatus;
          rating: number | null;
          body: string | null;
          recommender_linkedin_sub: string | null;
          recommender_linkedin_name: string | null;
          created_at: string;
          submitted_at: string | null;
        };
        Insert: {
          candidate_id: string;
          recommender_name: string;
          recommender_contact: string;
          delivery_method: RecommendationDelivery;
          status?: RecommendationStatus;
          token?: string;
        };
        Update: {
          status?: RecommendationStatus;
          rating?: number | null;
          body?: string | null;
          recommender_linkedin_sub?: string | null;
          recommender_linkedin_name?: string | null;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
      company_members: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          user_id: string | null;
          role: CompanyMemberRole;
          status: CompanyMemberStatus;
          invited_by: string;
          created_at: string;
        };
        Insert: {
          company_id: string;
          email: string;
          invited_by: string;
          role?: CompanyMemberRole;
          status?: CompanyMemberStatus;
          user_id?: string | null;
        };
        Update: {
          user_id?: string | null;
          role?: CompanyMemberRole;
          status?: CompanyMemberStatus;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          id: string;
          company_id: string;
          connection_id: string;
          scheduled_by: string;
          scheduled_at: string;
          duration_minutes: number;
          location_type: InterviewLocationType;
          notes: string | null;
          status: InterviewStatus;
          created_at: string;
        };
        Insert: {
          company_id: string;
          connection_id: string;
          scheduled_by: string;
          scheduled_at: string;
          duration_minutes?: number;
          location_type?: InterviewLocationType;
          notes?: string | null;
          status?: InterviewStatus;
        };
        Update: {
          scheduled_at?: string;
          duration_minutes?: number;
          location_type?: InterviewLocationType;
          notes?: string | null;
          status?: InterviewStatus;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_recommendation: {
        Args: {
          p_token: string;
          p_rating: number;
          p_body: string;
          p_linkedin_sub: string;
          p_linkedin_name: string;
        };
        Returns: undefined;
      };
      recommendation_request_preview: {
        Args: { p_token: string };
        Returns: { status: string; candidate_name: string | null }[];
      };
      list_submitted_recommendations: {
        Args: { p_candidate_id: string };
        Returns: {
          id: string;
          rating: number | null;
          body: string | null;
          recommender_name: string;
        }[];
      };
      pending_company_invite: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          company_id: string;
          company_name: string;
          role: string;
        }[];
      };
      claim_company_invite: {
        Args: Record<string, never>;
        Returns: { company_id: string; company_name: string }[];
      };
      list_related_push_subscriptions: {
        Args: { p_user_id: string };
        Returns: { endpoint: string; p256dh: string; auth: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
