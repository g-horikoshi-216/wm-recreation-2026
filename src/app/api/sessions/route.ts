import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TEAM_NAMES } from '@/lib/constants';

// セッション作成（チームA-I自動生成）
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'セッション名は必須です' }, { status: 400 });
    }

    // セッション作成
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({ name })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // チームA-I を自動生成
    const teams = TEAM_NAMES.map((teamName) => ({
      session_id: session.id,
      name: teamName,
    }));

    const { error: teamsError } = await supabase.from('teams').insert(teams);

    if (teamsError) {
      throw teamsError;
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'セッションの作成に失敗しました' }, { status: 500 });
  }
}

// セッション一覧取得
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ error: 'セッションの取得に失敗しました' }, { status: 500 });
  }
}
