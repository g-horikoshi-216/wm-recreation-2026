// チーム対抗クイズアプリ 採点ロジック

import { Question, Answer, ResultType, ScoringResult } from './types';

interface CorrectAnswer {
  first: string;
  second: string;
  third: string;
  tieFirstSecond: boolean;
  tieSecondThird: boolean;
}

interface Prediction {
  first: string;
  second: string;
  third: string;
}

/**
 * 予想と正解を比較して採点結果を返す
 */
export function calculateScore(
  prediction: Prediction,
  correct: CorrectAnswer,
  points: {
    trifecta: number;
    trio: number;
    two: number;
    one: number;
  }
): ScoringResult {
  const resultType = determineResultType(prediction, correct);
  const resultPoints = getPoints(resultType, points);

  return {
    resultType,
    points: resultPoints,
  };
}

/**
 * 結果タイプを判定する
 */
function determineResultType(
  prediction: Prediction,
  correct: CorrectAnswer
): ResultType {
  const correctTop3 = [correct.first, correct.second, correct.third];
  const predictTop3 = [prediction.first, prediction.second, prediction.third];

  // 三連単チェック（同着を考慮）
  if (isTrifecta(prediction, correct)) {
    return 'trifecta';
  }

  // 三連複チェック（3人全員が3位以内に入っている、順不同）
  const allInTop3 = predictTop3.every(p => correctTop3.includes(p));
  if (allInTop3) {
    return 'trio';
  }

  // 何人が3位以内に入っているかカウント
  const hitCount = predictTop3.filter(p => correctTop3.includes(p)).length;

  if (hitCount === 2) {
    return 'two';
  }

  if (hitCount === 1) {
    return 'one';
  }

  return 'none';
}

/**
 * 三連単（完全一致）かどうかを判定（同着を考慮）
 */
function isTrifecta(prediction: Prediction, correct: CorrectAnswer): boolean {
  // 同着なしの場合
  if (!correct.tieFirstSecond && !correct.tieSecondThird) {
    return (
      prediction.first === correct.first &&
      prediction.second === correct.second &&
      prediction.third === correct.third
    );
  }

  // 1位と2位が同着の場合
  if (correct.tieFirstSecond) {
    const tiedPair = [correct.first, correct.second].sort();
    const predictedPair = [prediction.first, prediction.second].sort();

    // 1着と2着の組み合わせが一致し、3着も一致
    if (
      tiedPair[0] === predictedPair[0] &&
      tiedPair[1] === predictedPair[1] &&
      prediction.third === correct.third
    ) {
      return true;
    }
  }

  // 2位と3位が同着の場合
  if (correct.tieSecondThird) {
    const tiedPair = [correct.second, correct.third].sort();
    const predictedPair = [prediction.second, prediction.third].sort();

    // 1着が一致し、2着と3着の組み合わせが一致
    if (
      prediction.first === correct.first &&
      tiedPair[0] === predictedPair[0] &&
      tiedPair[1] === predictedPair[1]
    ) {
      return true;
    }
  }

  return false;
}

/**
 * 結果タイプに応じたポイントを取得
 */
function getPoints(
  resultType: ResultType,
  points: {
    trifecta: number;
    trio: number;
    two: number;
    one: number;
  }
): number {
  switch (resultType) {
    case 'trifecta':
      return points.trifecta;
    case 'trio':
      return points.trio;
    case 'two':
      return points.two;
    case 'one':
      return points.one;
    case 'none':
      return 0;
  }
}

/**
 * 問題と回答から採点結果を計算する
 */
export function scoreAnswer(question: Question, answer: Answer): ScoringResult {
  if (!question.correct_first || !question.correct_second || !question.correct_third) {
    throw new Error('正解が設定されていません');
  }

  return calculateScore(
    {
      first: answer.predict_first,
      second: answer.predict_second,
      third: answer.predict_third,
    },
    {
      first: question.correct_first,
      second: question.correct_second,
      third: question.correct_third,
      tieFirstSecond: question.tie_first_second,
      tieSecondThird: question.tie_second_third,
    },
    {
      trifecta: question.points_trifecta,
      trio: question.points_trio,
      two: question.points_two,
      one: question.points_one,
    }
  );
}
