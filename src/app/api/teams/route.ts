import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// チーム一覧・スコア取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    let query = supabase
      .from('teams')
      .select('*')
      .order('total_score', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Team fetch error:', error);
    return NextResponse.json({ error: 'チームの取得に失敗しました' }, { status: 500 });
  }
}
