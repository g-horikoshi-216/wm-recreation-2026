import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 締め切り解除（回答受付を再開）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 問題のステータスをclosedからopenに戻す
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // closedの場合のみ再開可能
    if (question.status !== 'closed') {
      return NextResponse.json(
        { error: '締め切り済みの問題のみ解除できます' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('questions')
      .update({ status: 'open' })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question reopen error:', error);
    return NextResponse.json({ error: '締め切り解除に失敗しました' }, { status: 500 });
  }
}
