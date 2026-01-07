import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// チーム情報更新（スコア編集用）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('teams')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Team update error:', error);
    return NextResponse.json({ error: 'チームの更新に失敗しました' }, { status: 500 });
  }
}
