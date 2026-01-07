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
