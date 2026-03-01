export type McatSection = "bio_biochem" | "chem_phys" | "psych_soc" | "cars";

export interface Profile {
  id: string;
  display_name: string | null;
  exam_date: string | null;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  streak_freezes: number;
  email_notifications: boolean;
  study_reminder_time: string;
  timezone: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  mcat_section: McatSection;
  topic: string;
  subtopic: string | null;
  question: string;
  answer: string;
  difficulty: number;
  created_at: string;
}

export interface UserCardProgress {
  id: string;
  user_id: string;
  card_id: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  times_seen: number;
  times_correct: number;
  last_reviewed_at: string | null;
}

export interface CardWithProgress extends Flashcard {
  progress: UserCardProgress | null;
}

export interface QuizSession {
  id: string;
  user_id: string;
  mcat_section: McatSection | null;
  total_questions: number;
  correct_answers: number;
  xp_earned: number;
  duration_seconds: number;
  completed_at: string;
}

export interface QuizAnswer {
  id: string;
  session_id: string;
  card_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

// SM-2 card state
export interface CardProgress {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export type StudyRating = 0 | 1 | 2; // 0=didn't know, 1=almost, 2=knew it

// Quiz question with options
export interface QuizQuestionData {
  card: Flashcard;
  options: string[];
  correctIndex: number;
}

// Dashboard stats
export interface DashboardStats {
  dueToday: number;
  studiedToday: number;
  weeklyData: { day: string; count: number }[];
  sectionAccuracy: { section: McatSection; accuracy: number; total: number }[];
  weakTopics: { topic: string; accuracy: number; count: number }[];
}

// XP events
export type XpEvent =
  | "card_reviewed"
  | "card_correct"
  | "quiz_completed"
  | "quiz_perfect"
  | "daily_goal_met";
