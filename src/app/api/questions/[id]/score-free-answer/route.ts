import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 自由回答の採点（⚪︎/×をつけてスコア更新）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { scores } = body; // { [answerId]: boolean } の形式

    if (!scores || typeof scores !== 'object') {
      return NextResponse.json({ error: 'scores は必須です' }, { status: 400 });
    }

    // 問題を取得
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: '問題が見つかりません' }, { status: 404 });
    }

    if (question.question_type !== 'free_answer') {
      return NextResponse.json({ error: 'この問題は自由回答型ではありません' }, { status: 400 });
    }

    if (question.status !== 'closed') {
      return NextResponse.json({ error: '回答締め切り後に採点してください' }, { status: 400 });
    }

    // 各回答を採点
    const answerIds = Object.keys(scores);
    for (const answerId of answerIds) {
      const isCorrect = scores[answerId];
      const pointsEarned = isCorrect ? question.free_answer_points : 0;

      // 回答を更新
      const { data: answer, error: answerError } = await supabase
        .from('answers')
        .update({
          is_correct: isCorrect,
          points_earned: pointsEarned,
        })
        .eq('id', answerId)
        .eq('question_id', id)
        .select('team_id')
        .single();

      if (answerError || !answer) {
        console.error(`Failed to update answer ${answerId}:`, answerError);
        continue;
      }

      // 正解の場合、チームのスコアを更新
      if (isCorrect) {
        const { data: team } = await supabase
          .from('teams')
          .select('total_score')
          .eq('id', answer.team_id)
          .single();

        if (team) {
          await supabase
            .from('teams')
            .update({ total_score: team.total_score + pointsEarned })
            .eq('id', answer.team_id);
        }
      }
    }

    // 問題のステータスを revealed に更新
    await supabase
      .from('questions')
      .update({ status: 'revealed' })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Free answer scoring error:', error);
    return NextResponse.json({ error: '採点に失敗しました' }, { status: 500 });
  }
}
