// チーム対抗クイズアプリ 型定義

export type TeamName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type SessionStatus = 'waiting' | 'active' | 'finished';

export type QuestionStatus = 'pending' | 'open' | 'closed' | 'revealed';

export type ResultType = 'trifecta' | 'trio' | 'two' | 'one' | 'none';

export interface QuizSession {
  id: string;
  name: string;
  status: SessionStatus;
  current_question_id: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  session_id: string;
  name: TeamName;
  total_score: number;
  created_at: string;
}

export interface Question {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  choices: string[];
  points_trifecta: number;
  points_trio: number;
  points_two: number;
  points_one: number;
  status: QuestionStatus;
  correct_first: string | null;
  correct_second: string | null;
  correct_third: string | null;
  tie_first_second: boolean;
  tie_second_third: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  team_id: string;
  predict_first: string;
  predict_second: string;
  predict_third: string;
  result_type: ResultType | null;
  points_earned: number | null;
  answered_at: string;
}

export interface AnswerWithTeam extends Answer {
  team: Team;
}

export interface TeamWithAnswers extends Team {
  answers: Answer[];
}

export interface ScoringResult {
  resultType: ResultType;
  points: number;
}
