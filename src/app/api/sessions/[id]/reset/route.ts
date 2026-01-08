import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// セッションリセット（問題は保持、回答・スコア・ステータスをリセット）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. 関連する問題のIDを取得
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('session_id', id);

    // 2. 全ての回答を削除
    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      await supabase
        .from('answers')
        .delete()
        .in('question_id', questionIds);
    }

    // 3. 全ての問題のステータスをpendingに戻し、正解情報をクリア
    await supabase
      .from('questions')
      .update({
        status: 'pending',
        correct_first: null,
        correct_second: null,
        correct_third: null,
        tie_first_second: false,
        tie_second_third: false,
      })
      .eq('session_id', id);

    // 4. 全チームのスコアを0にリセット
    await supabase
      .from('teams')
      .update({ total_score: 0 })
      .eq('session_id', id);

    // 5. セッションのステータスをwaitingに戻し、current_question_idをnullに
    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        status: 'waiting',
        current_question_id: null,
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session reset error:', error);
    return NextResponse.json({ error: 'セッションのリセットに失敗しました' }, { status: 500 });
  }
}
