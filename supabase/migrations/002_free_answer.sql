-- 自由回答型クイズ機能追加のマイグレーション

-- questionsテーブルに question_type と free_answer_points を追加
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'trifecta' CHECK (question_type IN ('trifecta', 'free_answer')),
ADD COLUMN IF NOT EXISTS free_answer_points INTEGER DEFAULT 10;

-- answersテーブルに free_answer_text と is_correct を追加
ALTER TABLE answers
ADD COLUMN IF NOT EXISTS free_answer_text TEXT,
ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT NULL;

-- コメント
COMMENT ON COLUMN questions.question_type IS '問題タイプ: trifecta=3連単, free_answer=自由回答';
COMMENT ON COLUMN questions.free_answer_points IS '自由回答の正解時ポイント（デフォルト10）';
COMMENT ON COLUMN answers.free_answer_text IS '自由回答のテキスト（最大100文字）';
COMMENT ON COLUMN answers.is_correct IS '自由回答の採点結果: true=正解, false=不正解, null=未採点';
