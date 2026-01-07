-- チーム対抗クイズアプリ 初期スキーマ

-- quiz_sessions（クイズセッション）
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_question_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- teams（チーム）
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I')),
  total_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, name)
);

-- questions（問題）
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  choices JSONB NOT NULL DEFAULT '[]',
  points_trifecta INTEGER NOT NULL DEFAULT 30,
  points_trio INTEGER NOT NULL DEFAULT 15,
  points_two INTEGER NOT NULL DEFAULT 5,
  points_one INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed', 'revealed')),
  correct_first TEXT,
  correct_second TEXT,
  correct_third TEXT,
  tie_first_second BOOLEAN NOT NULL DEFAULT FALSE,
  tie_second_third BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, question_number)
);

-- quiz_sessionsのcurrent_question_idの外部キー制約を追加
ALTER TABLE quiz_sessions
ADD CONSTRAINT fk_current_question
FOREIGN KEY (current_question_id) REFERENCES questions(id) ON DELETE SET NULL;

-- answers（回答）
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  predict_first TEXT NOT NULL,
  predict_second TEXT NOT NULL,
  predict_third TEXT NOT NULL,
  result_type TEXT CHECK (result_type IN ('trifecta', 'trio', 'two', 'one', 'none')),
  points_earned INTEGER,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, team_id)
);

-- インデックス
CREATE INDEX idx_teams_session_id ON teams(session_id);
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_team_id ON answers(team_id);

-- Realtime用の設定
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- スコア更新用RPC関数
CREATE OR REPLACE FUNCTION increment_team_score(team_id UUID, points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE teams
  SET total_score = total_score + points
  WHERE id = team_id;
END;
$$ LANGUAGE plpgsql;
