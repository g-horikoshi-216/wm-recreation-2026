import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// セッション取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'セッションの取得に失敗しました' }, { status: 500 });
  }
}

// セッション更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'セッションの更新に失敗しました' }, { status: 500 });
  }
}

// セッション削除（関連データも全て削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 関連する回答を削除
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('session_id', id);

    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      await supabase
        .from('answers')
        .delete()
        .in('question_id', questionIds);
    }

    // 関連する問題を削除
    await supabase
      .from('questions')
      .delete()
      .eq('session_id', id);

    // 関連するチームを削除
    await supabase
      .from('teams')
      .delete()
      .eq('session_id', id);

    // セッション自体を削除
    const { error } = await supabase
      .from('quiz_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session delete error:', error);
    return NextResponse.json({ error: 'セッションの削除に失敗しました' }, { status: 500 });
  }
}
