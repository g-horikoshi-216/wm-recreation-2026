import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 出題開始（status → open）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 問題のステータスを open に更新
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .update({ status: 'open' })
      .eq('id', id)
      .select()
      .single();

    if (questionError) {
      throw questionError;
    }

    // セッションの current_question_id を更新
    await supabase
      .from('quiz_sessions')
      .update({
        current_question_id: id,
        status: 'active',
      })
      .eq('id', question.session_id);

    return NextResponse.json(question);
  } catch (error) {
    console.error('Question open error:', error);
    return NextResponse.json({ error: '出題開始に失敗しました' }, { status: 500 });
  }
}
