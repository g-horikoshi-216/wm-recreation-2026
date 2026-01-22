import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 問題取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Question fetch error:', error);
    return NextResponse.json({ error: '問題の取得に失敗しました' }, { status: 500 });
  }
}

// 問題更新（pending状態の問題のみ編集可能）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // 現在の問題を取得
    const { data: currentQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // pending状態の問題のみ編集可能
    if (currentQuestion.status !== 'pending') {
      return NextResponse.json(
        { error: '出題前の問題のみ編集できます' },
        { status: 400 }
      );
    }

    const { question_text, choices, free_answer_points } = body;

    const updateData: Record<string, unknown> = {
      question_text,
      choices,
    };

    if (free_answer_points !== undefined) {
      updateData.free_answer_points = free_answer_points;
    }

    const { data, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Question update error:', error);
    return NextResponse.json({ error: '問題の更新に失敗しました' }, { status: 500 });
  }
}

// 問題削除（pending状態の問題のみ削除可能）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 現在の問題を取得
    const { data: currentQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // pending状態の問題のみ削除可能
    if (currentQuestion.status !== 'pending') {
      return NextResponse.json(
        { error: '出題前の問題のみ削除できます' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question delete error:', error);
    return NextResponse.json({ error: '問題の削除に失敗しました' }, { status: 500 });
  }
}
