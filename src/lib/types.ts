// チーム対抗クイズアプリ 型定義

export type TeamName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type SessionStatus = 'waiting' | 'active' | 'finished';

export type QuestionStatus = 'pending' | 'open' | 'closed' | 'revealed';

// 3連単: 順番も人も完全一致
// 2連単: 1着と2着が順番込みで一致
// 3連複: 3人全員が3位以内（順不同）
// 2連複: 1着と2着の2人が3位以内（順不同）
// 単勝: 1着のみ一致
export type ResultType = 'trifecta' | 'exacta' | 'trio' | 'quinella' | 'win' | 'none';

export type QuestionType = 'trifecta' | 'free_answer';

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
  question_type: QuestionType;
  choices: string[];
  points_trifecta: number;  // 3連単: 50pt
  points_exacta: number;    // 2連単: 20pt
  points_trio: number;      // 3連複: 15pt
  points_quinella: number;  // 2連複: 10pt
  points_win: number;       // 単勝: 5pt
  free_answer_points: number;
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
  free_answer_text: string | null;
  is_correct: boolean | null;
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
