import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 回答送信
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { question_id, team_id, predict_first, predict_second, predict_third } = body;

    if (!question_id || !team_id || !predict_first || !predict_second || !predict_third) {
      return NextResponse.json(
        { error: 'question_id, team_id, predict_first, predict_second, predict_third は必須です' },
        { status: 400 }
      );
    }

    // 問題が open か確認
    const { data: question } = await supabase
      .from('questions')
      .select('status')
      .eq('id', question_id)
      .single();

    if (!question || question.status !== 'open') {
      return NextResponse.json({ error: 'この問題は現在回答を受け付けていません' }, { status: 400 });
    }

    // 重複チェック
    if (
      predict_first === predict_second ||
      predict_first === predict_third ||
      predict_second === predict_third
    ) {
      return NextResponse.json({ error: '同じ選択肢を複数回選ぶことはできません' }, { status: 400 });
    }

    // upsert（既存の回答があれば更新）
    const { data, error } = await supabase
      .from('answers')
      .upsert(
        {
          question_id,
          team_id,
          predict_first,
          predict_second,
          predict_third,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'question_id,team_id' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Answer submission error:', error);
    return NextResponse.json({ error: '回答の送信に失敗しました' }, { status: 500 });
  }
}

// 回答一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('question_id');
    const teamId = searchParams.get('team_id');

    let query = supabase.from('answers').select('*, team:teams(*)');

    if (questionId) {
      query = query.eq('question_id', questionId);
    }

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Answer fetch error:', error);
    return NextResponse.json({ error: '回答の取得に失敗しました' }, { status: 500 });
  }
}
