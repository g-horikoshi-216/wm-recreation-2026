-- 新しい得点体系への移行
-- 3連単: 50pt, 2連単: 20pt, 3連複: 15pt, 2連複: 10pt, 単勝: 5pt

-- questionsテーブルに新しいカラムを追加
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS points_exacta INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS points_quinella INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS points_win INTEGER DEFAULT 5;

-- 既存カラムのデフォルト値を更新
ALTER TABLE questions
ALTER COLUMN points_trifecta SET DEFAULT 50,
ALTER COLUMN points_trio SET DEFAULT 15;

-- 旧カラムを削除（points_two, points_one）
ALTER TABLE questions
DROP COLUMN IF EXISTS points_two,
DROP COLUMN IF EXISTS points_one;

-- answersテーブルのresult_typeの制約を更新
ALTER TABLE answers
DROP CONSTRAINT IF EXISTS answers_result_type_check;

ALTER TABLE answers
ADD CONSTRAINT answers_result_type_check
CHECK (result_type IN ('trifecta', 'exacta', 'trio', 'quinella', 'win', 'none'));
