import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scoreAnswer } from '@/lib/scoring';
import { Question, Answer } from '@/lib/types';

// 正解発表＋採点（status → revealed）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { correct_first, correct_second, correct_third, tie_first_second, tie_second_third } =
      body;

    if (!correct_first || !correct_second || !correct_third) {
      return NextResponse.json(
        { error: '正解（1着、2着、3着）は必須です' },
        { status: 400 }
      );
    }

    // 問題を更新
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .update({
        status: 'revealed',
        correct_first,
        correct_second,
        correct_third,
        tie_first_second: tie_first_second || false,
        tie_second_third: tie_second_third || false,
      })
      .eq('id', id)
      .select()
      .single();

    if (questionError) {
      throw questionError;
    }

    // この問題への回答を取得
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', id);

    if (answersError) {
      throw answersError;
    }

    // 各回答を採点して更新
    for (const answer of answers as Answer[]) {
      const result = scoreAnswer(question as Question, answer);

      // 回答を更新
      await supabase
        .from('answers')
        .update({
          result_type: result.resultType,
          points_earned: result.points,
        })
        .eq('id', answer.id);

      // チームのスコアを更新
      await supabase.rpc('increment_team_score', {
        team_id: answer.team_id,
        points: result.points,
      });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Question reveal error:', error);
    return NextResponse.json({ error: '正解発表に失敗しました' }, { status: 500 });
  }
}
